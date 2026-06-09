package com.supplychain.service;

import com.supplychain.config.NodeRPCConnection;
import com.supplychain.dto.MedicineResponse;
import com.supplychain.dto.TransferEventResponse;
import com.supplychain.entity.MedicineBatch;
import com.supplychain.entity.TransferEvent;
import com.supplychain.flows.CreateMedicineFlow;
import com.supplychain.flows.DispenseMedicineFlow;
import com.supplychain.flows.RecallMedicineFlow;
import com.supplychain.flows.TransferMedicineFlow;
import com.supplychain.repository.MedicineBatchRepository;
import com.supplychain.repository.TransferEventRepository;
import com.supplychain.states.MedicineState;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.services.Vault;
import net.corda.core.node.services.vault.QueryCriteria;
import net.corda.core.transactions.SignedTransaction;
import net.corda.core.identity.Party;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    private final CordaRPCOps             proxy;
    private final MedicineBatchRepository batchRepo;
    private final TransferEventRepository eventRepo;

    public MedicineService(NodeRPCConnection rpc,
                           MedicineBatchRepository batchRepo,
                           TransferEventRepository eventRepo) {
        this.proxy     = rpc.getProxy();
        this.batchRepo = batchRepo;
        this.eventRepo = eventRepo;
    }

    // ── Event persistence helper ──────────────────────────────────────────────

    private void saveEvent(String linearId, String medicineName, String serialNumber,
                           String batchNumber,
                           String fromOrgId, String fromOrgName,
                           String toOrgId,   String toOrgName,
                           String actionType, String performedBy, String resultingStatus) {
        TransferEvent ev = new TransferEvent();
        ev.setEventId(UUID.randomUUID().toString());
        ev.setMedicineLinearId(linearId);
        ev.setMedicineName(medicineName);
        ev.setSerialNumber(serialNumber);
        ev.setBatchNumber(batchNumber);
        ev.setFromOrganizationId(fromOrgId);
        ev.setFromOrganizationName(fromOrgName);
        ev.setToOrganizationId(toOrgId);
        ev.setToOrganizationName(toOrgName);
        ev.setActionType(actionType);
        ev.setPerformedBy(performedBy);
        ev.setTimestamp(LocalDateTime.now());
        ev.setResultingStatus(resultingStatus);
        eventRepo.save(ev);
    }

    // ── Batch creation ────────────────────────────────────────────────────────

    public List<MedicineResponse> createBatch(MedicineBatch batch, String ownerOrganizationId,
                                               String ownerOrganizationName) throws Exception {
        Party owner = proxy.nodeInfo().getLegalIdentities().get(0);
        List<MedicineResponse> created = new ArrayList<>();

        for (int i = 1; i <= batch.getQuantity(); i++) {
            String serial = batch.getBatchNumber() + String.format("-%04d", i);
            SignedTransaction tx = proxy.startFlowDynamic(
                    CreateMedicineFlow.class,
                    batch.getMedicineName(), batch.getGtin(),
                    batch.getBatchNumber(), serial,
                    batch.getManufacturerName(), batch.getExpiryDate(), batch.getCategory(),
                    owner, ownerOrganizationId, ownerOrganizationName,
                    batch.getDescription(), batch.getStrength(),
                    batch.getMedicineForm(), batch.getStorageCondition()
            ).getReturnValue().get();

            MedicineState state = (MedicineState) tx.getCoreTransaction().getOutputs().get(0).getData();
            MedicineResponse resp = MedicineResponse.from(state);
            created.add(resp);

            saveEvent(resp.getLinearId(), resp.getMedicineName(),
                    resp.getSerialNumber(), resp.getBatchNumber(),
                    null, null,
                    ownerOrganizationId, ownerOrganizationName,
                    "CREATED", ownerOrganizationName, MedicineState.STATUS_CREATED);
        }
        return created;
    }

    // ── Transfer ──────────────────────────────────────────────────────────────

    public MedicineResponse transferMedicine(String linearId, String cordaPartyName,
                                              String targetOrgId, String targetOrgName,
                                              String performedBy) throws Exception {
        Set<Party> parties = proxy.partiesFromName(cordaPartyName, false);
        if (parties.isEmpty()) throw new IllegalArgumentException("No Corda party found: " + cordaPartyName);
        Party newOwner = parties.iterator().next();

        // Capture current owner before transfer
        MedicineResponse before = getMedicineById(linearId);
        String fromOrgId   = before.getOwnerOrganizationId();
        String fromOrgName = before.getOwnerOrganizationName();

        SignedTransaction tx = proxy.startFlowDynamic(
                TransferMedicineFlow.class, linearId, newOwner, targetOrgId, targetOrgName
        ).getReturnValue().get();

        MedicineState state = (MedicineState) tx.getCoreTransaction().getOutputs().get(0).getData();
        MedicineResponse result = MedicineResponse.from(state);

        String actionType = MedicineState.STATUS_IN_DISTRIBUTION.equals(result.getStatus())
                ? "TRANSFERRED_TO_DISTRIBUTOR"
                : "TRANSFERRED_TO_PHARMACY";

        saveEvent(result.getLinearId(), result.getMedicineName(),
                result.getSerialNumber(), result.getBatchNumber(),
                fromOrgId, fromOrgName,
                targetOrgId, targetOrgName,
                actionType, performedBy, result.getStatus());

        return result;
    }

    // ── Dispense (ZKP privacy model) ──────────────────────────────────────────
    // Only the SHA-256 hash of the prescription reference is stored on blockchain.
    // The raw prescription stays off-chain at the pharmacy. This is the ZKP concept.

    public MedicineResponse dispenseMedicine(String linearId, String prescriptionReference,
                                              String performedBy) throws Exception {
        // Capture current owner before dispense
        MedicineResponse before = getMedicineById(linearId);
        String fromOrgId   = before.getOwnerOrganizationId();
        String fromOrgName = before.getOwnerOrganizationName();

        String prescriptionHash = computePrivacyHash(prescriptionReference, linearId);

        SignedTransaction tx = proxy.startFlowDynamic(
                DispenseMedicineFlow.class, linearId, prescriptionHash
        ).getReturnValue().get();

        MedicineState state = (MedicineState) tx.getCoreTransaction().getOutputs().get(0).getData();
        MedicineResponse r = MedicineResponse.from(state);
        r.setPrescriptionHash(prescriptionHash);

        saveEvent(r.getLinearId(), r.getMedicineName(),
                r.getSerialNumber(), r.getBatchNumber(),
                fromOrgId, fromOrgName,
                null, null,
                "DISPENSED_TO_PATIENT", performedBy, MedicineState.STATUS_DISPENSED_TO_PATIENT);

        return r;
    }

    private String computePrivacyHash(String prescriptionRef, String linearId) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String input = prescriptionRef + ":" + linearId;
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return prescriptionRef;
        }
    }

    // ── Recall ────────────────────────────────────────────────────────────────

    public MedicineResponse recallMedicine(String linearId, String performedBy) throws Exception {
        // Capture current owner before recall
        MedicineResponse before = getMedicineById(linearId);
        String fromOrgId   = before.getOwnerOrganizationId();
        String fromOrgName = before.getOwnerOrganizationName();

        SignedTransaction tx = proxy.startFlowDynamic(
                RecallMedicineFlow.class, linearId
        ).getReturnValue().get();

        MedicineState state = (MedicineState) tx.getCoreTransaction().getOutputs().get(0).getData();
        MedicineResponse result = MedicineResponse.from(state);

        saveEvent(result.getLinearId(), result.getMedicineName(),
                result.getSerialNumber(), result.getBatchNumber(),
                fromOrgId, fromOrgName,
                null, null,
                "RECALLED", performedBy, MedicineState.STATUS_RECALLED);

        return result;
    }

    public List<MedicineResponse> recallBatch(String batchNumber) throws Exception {
        List<MedicineResponse> all = getAllMedicines();
        List<MedicineResponse> recalled = new ArrayList<>();
        for (MedicineResponse m : all) {
            if (batchNumber.equals(m.getBatchNumber())
                    && !MedicineState.STATUS_RECALLED.equals(m.getStatus())
                    && !MedicineState.STATUS_DISPENSED_TO_PATIENT.equals(m.getStatus())) {
                recalled.add(recallMedicine(m.getLinearId(), null));
            }
        }
        return recalled;
    }

    // ── Transfer Event queries ────────────────────────────────────────────────

    public List<TransferEventResponse> getTransferEvents(String medicineLinearId) {
        return eventRepo.findByMedicineLinearIdOrderByTimestampAsc(medicineLinearId)
                .stream()
                .map(TransferEventResponse::from)
                .collect(Collectors.toList());
    }

    public List<TransferEventResponse> getAllTransferEvents() {
        return eventRepo.findAllByOrderByTimestampDesc()
                .stream()
                .map(TransferEventResponse::from)
                .collect(Collectors.toList());
    }

    // ── Vault Queries ─────────────────────────────────────────────────────────

    public List<MedicineResponse> getAllMedicines() {
        return proxy.vaultQuery(MedicineState.class).getStates().stream()
                .map(s -> MedicineResponse.from(s.getState().getData()))
                .collect(Collectors.toList());
    }

    public List<MedicineResponse> getAllMedicinesIncludingConsumed() {
        QueryCriteria all = new QueryCriteria.VaultQueryCriteria(Vault.StateStatus.ALL);
        return proxy.vaultQueryByCriteria(all, MedicineState.class).getStates().stream()
                .map(s -> MedicineResponse.from(s.getState().getData()))
                .collect(Collectors.toList());
    }

    public MedicineResponse getMedicineById(String linearId) {
        QueryCriteria criteria = new QueryCriteria.LinearStateQueryCriteria(
                null, Collections.singletonList(UUID.fromString(linearId)), null, Vault.StateStatus.UNCONSUMED);
        List<MedicineState> states = proxy.vaultQueryByCriteria(criteria, MedicineState.class)
                .getStates().stream().map(s -> s.getState().getData()).collect(Collectors.toList());
        if (states.isEmpty()) throw new IllegalArgumentException("Medicine not found: " + linearId);
        return MedicineResponse.from(states.get(0));
    }

    public List<MedicineResponse> getMedicineHistory(String linearId) {
        QueryCriteria criteria = new QueryCriteria.LinearStateQueryCriteria(
                null, Collections.singletonList(UUID.fromString(linearId)), null, Vault.StateStatus.ALL);
        return proxy.vaultQueryByCriteria(criteria, MedicineState.class).getStates().stream()
                .map(s -> MedicineResponse.from(s.getState().getData()))
                .collect(Collectors.toList());
    }

    public List<MedicineResponse> getMedicinesByOrganizationId(String orgId) {
        return getAllMedicines().stream()
                .filter(m -> orgId.equals(m.getOwnerOrganizationId()))
                .collect(Collectors.toList());
    }

    public int getTotalTransfers() {
        QueryCriteria consumed = new QueryCriteria.VaultQueryCriteria(Vault.StateStatus.CONSUMED);
        return proxy.vaultQueryByCriteria(consumed, MedicineState.class).getStates().size();
    }

    public String getMyNodeName() {
        return proxy.nodeInfo().getLegalIdentities().get(0).getName().getOrganisation();
    }

    // ── Batch repo ────────────────────────────────────────────────────────────

    public MedicineBatch saveBatch(MedicineBatch batch) { return batchRepo.save(batch); }

    public List<MedicineBatch> getBatchesByOrg(String orgId) {
        return batchRepo.findByOrganizationId(orgId);
    }

    public List<MedicineBatch> getAllBatches() {
        return batchRepo.findAll();
    }

    public List<MedicineBatch> getAvailableBatchesByOrg(String orgId) {
        return batchRepo.findByOrganizationIdAndQuantityGreaterThan(orgId, 0);
    }

    public java.util.Optional<MedicineBatch> findBatchByOrgAndBatchNumber(String orgId, String batchNumber) {
        return batchRepo.findByOrganizationIdAndBatchNumber(orgId, batchNumber);
    }

    // ── H2 ownership inventory (3-step model) ────────────────────────────────
    //
    //  DISPATCH → lockForTransit:  lockedQuantity += N  (quantity unchanged)
    //  ACCEPT   → confirmOwnership: sender.lockedQty -= N, sender.qty -= N
    //                                receiver.qty += N  (creates batch if needed)
    //  REJECT   → unlockFromTransit: lockedQuantity -= N (quantity unchanged, goods returned)
    //
    //  availableQuantity = quantity - lockedQuantity
    //  Transfer screen only shows batches where availableQuantity > 0

    /**
     * Lock N units in sender's batch when dispatching.
     * quantity stays the same; lockedQuantity increases.
     * Returns the updated available quantity for validation.
     */
    public int lockForTransit(String orgId, String batchNumber, int quantity) {
        MedicineBatch batch = batchRepo.findByOrganizationIdAndBatchNumber(orgId, batchNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Envanterde bu parti bulunamadı: " + batchNumber + " / org: " + orgId));

        int available = batch.getQuantity() - batch.getLockedQuantity();
        if (available < quantity) {
            throw new IllegalStateException(
                    "Yeterli stok yok. Mevcut: " + available + ", İstenen: " + quantity);
        }

        batch.setLockedQuantity(batch.getLockedQuantity() + quantity);
        batchRepo.save(batch);
        return batch.getAvailableQuantity();
    }

    /**
     * Direct ownership transfer: sender -= N, receiver += N.
     * Throws a clear exception if the sender's batch is not found.
     */
    public void confirmOwnershipTransfer(String fromOrgId, String toOrgId,
                                          String batchNumber, int quantity, String refNo) {

        // ── Sender: reduce quantity ───────────────────────────────────────────
        MedicineBatch senderBatch = batchRepo
                .findByOrganizationIdAndBatchNumber(fromOrgId, batchNumber)
                .orElseThrow(() -> new IllegalStateException(
                        "Gönderici parti bulunamadı — orgId: " + fromOrgId + ", batch: " + batchNumber));

        int afterQty = senderBatch.getQuantity() - quantity;
        if (afterQty < 0) {
            throw new IllegalStateException(
                    "Yetersiz stok. Mevcut: " + senderBatch.getQuantity() + ", İstenen: " + quantity);
        }
        senderBatch.setLockedQuantity(Math.max(0, senderBatch.getLockedQuantity() - quantity));
        senderBatch.setQuantity(afterQty);
        batchRepo.save(senderBatch);

        // ── Receiver: add to existing batch or create new one ─────────────────
        java.util.Optional<MedicineBatch> receiverOpt =
                batchRepo.findByOrganizationIdAndBatchNumber(toOrgId, batchNumber);

        if (receiverOpt.isPresent()) {
            MedicineBatch rb = receiverOpt.get();
            rb.setQuantity(rb.getQuantity() + quantity);
            batchRepo.save(rb);
        } else {
            // Copy metadata from sender batch (it's already loaded)
            MedicineBatch nb = new MedicineBatch(
                "TRF-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                senderBatch.getMedicineName(),
                senderBatch.getGtin()             != null ? senderBatch.getGtin()             : "",
                batchNumber,
                senderBatch.getManufacturerName() != null ? senderBatch.getManufacturerName() : "",
                senderBatch.getExpiryDate()       != null ? senderBatch.getExpiryDate()       : "",
                senderBatch.getCategory()         != null ? senderBatch.getCategory()         : "",
                quantity,
                toOrgId,
                "Transfer — Ref: " + refNo,
                senderBatch.getStrength()         != null ? senderBatch.getStrength()         : "",
                senderBatch.getMedicineForm()     != null ? senderBatch.getMedicineForm()     : "",
                senderBatch.getStorageCondition() != null ? senderBatch.getStorageCondition() : ""
            );
            batchRepo.save(nb);
        }
    }

    /**
     * Unlock units when receiver rejects (goods come back to sender).
     * lockedQuantity decreases; quantity stays the same.
     */
    public void unlockFromTransit(String orgId, String batchNumber, int quantity) {
        batchRepo.findByOrganizationIdAndBatchNumber(orgId, batchNumber).ifPresent(b -> {
            b.setLockedQuantity(Math.max(0, b.getLockedQuantity() - quantity));
            batchRepo.save(b);
        });
    }

    /**
     * Records a batch-level audit transfer event in H2 (no Corda required).
     */
    public void recordBatchTransferEvent(String medicineName, String batchNumber,
                                          String fromOrgId, String fromOrgName,
                                          String toOrgId, String toOrgName,
                                          String actionType, String performedBy) {
        TransferEvent ev = new TransferEvent();
        ev.setEventId(java.util.UUID.randomUUID().toString());
        ev.setMedicineLinearId("batch-" + batchNumber + "-" + java.util.UUID.randomUUID().toString().substring(0, 6));
        ev.setMedicineName(medicineName);
        ev.setBatchNumber(batchNumber);
        ev.setFromOrganizationId(fromOrgId);
        ev.setFromOrganizationName(fromOrgName);
        ev.setToOrganizationId(toOrgId);
        ev.setToOrganizationName(toOrgName);
        ev.setActionType(actionType);
        ev.setPerformedBy(performedBy);
        ev.setTimestamp(LocalDateTime.now());
        ev.setResultingStatus(actionType);
        eventRepo.save(ev);
    }
}
