package com.supplychain.service;

import com.supplychain.dto.CreateTransferRequestDto;
import com.supplychain.dto.MedicineResponse;
import com.supplychain.dto.TransferRequestResponse;
import com.supplychain.entity.MedicineBatch;
import com.supplychain.entity.Organization;
import com.supplychain.entity.TransferRequest;
import com.supplychain.repository.TransferRequestRepository;
import com.supplychain.states.MedicineState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * SIMPLIFIED DIRECT TRANSFER MODEL — no mal kabul (goods receipt) step.
 *
 * Flow:
 *   1. CREATE (PENDING)   — validates sender has enough stock, no inventory change
 *   2. DISPATCH           — immediate ownership transfer (sender -= N, receiver += N)
 *      → Status: TRANSFERRED
 *   3. CANCEL (PENDING→CANCELLED) — no inventory change
 *
 * The receiver's inventory updates instantly at dispatch time.
 * No acceptance/rejection steps required.
 */
@Service
public class TransferRequestService {

    private static final Logger log = LoggerFactory.getLogger(TransferRequestService.class);

    private final TransferRequestRepository requestRepo;
    private final MedicineService           medicineService;
    private final OrganizationService       orgService;

    public TransferRequestService(TransferRequestRepository requestRepo,
                                   MedicineService medicineService,
                                   OrganizationService orgService) {
        this.requestRepo     = requestRepo;
        this.medicineService = medicineService;
        this.orgService      = orgService;
    }

    @Transactional
    public TransferRequestResponse createRequest(CreateTransferRequestDto dto,
                                                  String fromOrgId, String fromOrgName,
                                                  String createdBy) {
        if (dto.getQuantity() < 1)
            throw new IllegalArgumentException("Miktar en az 1 olmalıdır.");

        Organization targetOrg = orgService.findEntityById(dto.getTargetOrganizationId());

        MedicineBatch senderBatch = medicineService
                .findBatchByOrgAndBatchNumber(fromOrgId, dto.getBatchNumber())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Bu partiye ait stok bulunamadı: " + dto.getBatchNumber()));

        int available = senderBatch.getAvailableQuantity();
        if (available < dto.getQuantity()) {
            throw new IllegalArgumentException(
                    "Yeterli stok yok. Kullanılabilir: " + available + ", İstenen: " + dto.getQuantity());
        }

        // Best-effort: collect Corda linearIds for audit
        List<String> pickedIds = new ArrayList<>();
        try {
            pickedIds = medicineService.getAllMedicines().stream()
                    .filter(m -> dto.getBatchNumber().equals(m.getBatchNumber()))
                    .filter(m -> fromOrgId.equals(m.getOwnerOrganizationId()))
                    .filter(m -> !MedicineState.STATUS_RECALLED.equals(m.getStatus()))
                    .filter(m -> !MedicineState.STATUS_DISPENSED_TO_PATIENT.equals(m.getStatus()))
                    .limit(dto.getQuantity())
                    .map(MedicineResponse::getLinearId)
                    .collect(Collectors.toList());
        } catch (Exception ignored) {}

        TransferRequest req = new TransferRequest();
        req.setTransferRequestId(UUID.randomUUID().toString());
        req.setFromOrganizationId(fromOrgId);
        req.setFromOrganizationName(fromOrgName);
        req.setToOrganizationId(targetOrg.getOrganizationId());
        req.setToOrganizationName(targetOrg.getOrganizationName());
        req.setToCordaPartyName(targetOrg.getCordaPartyName());
        req.setMedicineName(dto.getMedicineName() != null ? dto.getMedicineName()
                : senderBatch.getMedicineName());
        req.setBatchNumber(dto.getBatchNumber());
        req.setGtin(dto.getGtin() != null ? dto.getGtin() : senderBatch.getGtin());
        req.setQuantity(dto.getQuantity());
        req.setLinearIdsCsv(String.join(",", pickedIds));
        req.setStatus("PENDING");
        req.setTransferReferenceNo("TRF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        req.setNotes(dto.getNotes());
        req.setCreatedBy(createdBy);
        req.setCreatedAt(LocalDateTime.now());

        return TransferRequestResponse.from(requestRepo.save(req));
    }

    /**
     * DISPATCH: performs direct inventory transfer.
     * sender inventory -= quantity, receiver inventory += quantity
     * Status → TRANSFERRED immediately (no acceptance step needed).
     */
    @Transactional
    public TransferRequestResponse dispatchRequest(String requestId, String performedBy) {
        TransferRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer talebi bulunamadı: " + requestId));

        if (!"PENDING".equals(req.getStatus()))
            throw new IllegalStateException("Yalnızca PENDING durumundaki talepler gönderilebilir.");

        log.info("[TRANSFER DISPATCH] requestId={} from={} to={} batch={} qty={}",
                requestId, req.getFromOrganizationId(), req.getToOrganizationId(),
                req.getBatchNumber(), req.getQuantity());

        // Direct ownership transfer — H2 inventory updated immediately
        medicineService.confirmOwnershipTransfer(
                req.getFromOrganizationId(),
                req.getToOrganizationId(),
                req.getBatchNumber(),
                req.getQuantity(),
                req.getTransferReferenceNo());

        log.info("[TRANSFER DISPATCH] Inventory updated. Ref={}", req.getTransferReferenceNo());

        // H2 audit trail
        medicineService.recordBatchTransferEvent(
                req.getMedicineName(), req.getBatchNumber(),
                req.getFromOrganizationId(), req.getFromOrganizationName(),
                req.getToOrganizationId(), req.getToOrganizationName(),
                "TRANSFERRED", performedBy);

        req.setStatus("TRANSFERRED");
        req.setDispatchedAt(LocalDateTime.now());
        req.setDispatchedBy(performedBy);
        req.setAcceptedAt(LocalDateTime.now());
        req.setAcceptedBy("auto");

        return TransferRequestResponse.from(requestRepo.save(req));
    }

    /**
     * DIRECT TRANSFER: creates AND dispatches in a single atomic operation.
     * No separate "pending" phase — inventory updates immediately.
     */
    @Transactional
    public TransferRequestResponse transferDirect(CreateTransferRequestDto dto,
                                                   String fromOrgId, String fromOrgName,
                                                   String performedBy) {
        log.info("[DIRECT TRANSFER] from={} to={} batch={} qty={}",
                fromOrgId, dto.getTargetOrganizationId(), dto.getBatchNumber(), dto.getQuantity());

        // 1. Validate and create the request record
        TransferRequestResponse pending = createRequest(dto, fromOrgId, fromOrgName, performedBy);

        // 2. Immediately dispatch (no wait)
        TransferRequestResponse completed = dispatchRequest(pending.getTransferRequestId(), performedBy);

        log.info("[DIRECT TRANSFER] Completed. Ref={} status={}", completed.getTransferReferenceNo(), completed.getStatus());
        return completed;
    }

    /**
     * CANCEL: cancels a PENDING request before dispatch.
     * No inventory change — dispatch never ran.
     */
    @Transactional
    public TransferRequestResponse cancelRequest(String requestId) {
        TransferRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer talebi bulunamadı: " + requestId));
        if (!"PENDING".equals(req.getStatus()))
            throw new IllegalStateException("Yalnızca PENDING durumundaki talepler iptal edilebilir.");
        req.setStatus("CANCELLED");
        return TransferRequestResponse.from(requestRepo.save(req));
    }

    // ── Legacy stubs (kept for API compatibility, not used in normal flow) ───

    /** @deprecated Direct transfer is used instead */
    @Transactional
    public TransferRequestResponse acceptRequest(String requestId, String performedBy) {
        return dispatchRequest(requestId, performedBy);
    }

    /** @deprecated Rejection is not part of the simplified flow */
    @Transactional
    public TransferRequestResponse rejectRequest(String requestId, String performedBy, String reason) {
        TransferRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer talebi bulunamadı: " + requestId));
        req.setStatus("CANCELLED");
        req.setRejectionReason(reason);
        return TransferRequestResponse.from(requestRepo.save(req));
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public List<TransferRequestResponse> getOutgoingRequests(String orgId) {
        return requestRepo.findByFromOrganizationIdOrderByCreatedAtDesc(orgId)
                .stream().map(TransferRequestResponse::from).collect(Collectors.toList());
    }

    public List<TransferRequestResponse> getIncomingRequests(String orgId) {
        return requestRepo.findByToOrganizationIdOrderByCreatedAtDesc(orgId)
                .stream().map(TransferRequestResponse::from).collect(Collectors.toList());
    }

    public List<TransferRequestResponse> getPendingAcceptance(String orgId) {
        return new ArrayList<>(); // Mal kabul kaldırıldı
    }

    public List<TransferRequestResponse> getAllRequests() {
        return requestRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(TransferRequestResponse::from).collect(Collectors.toList());
    }

    public long countPending(String orgId) {
        return requestRepo.countByFromOrganizationIdAndStatus(orgId, "PENDING");
    }

    public long countPendingAcceptance(String orgId) {
        return 0; // Mal kabul yok
    }

    public long countAccepted() {
        return requestRepo.countByStatus("TRANSFERRED");
    }

    public long countRejected() {
        return requestRepo.countByStatus("CANCELLED");
    }

    public long countTransferredToday() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        return requestRepo.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> "TRANSFERRED".equals(t.getStatus()))
                .filter(t -> t.getDispatchedAt() != null && t.getDispatchedAt().isAfter(startOfDay))
                .count();
    }

    /** Count completed incoming transfers for an org (receiver side). */
    public long countIncomingTransferred(String orgId) {
        return requestRepo.countByToOrganizationIdAndStatus(orgId, "TRANSFERRED");
    }

    /** Count completed outgoing transfers for an org (sender side). */
    public long countOutgoingTransferred(String orgId) {
        return requestRepo.countByFromOrganizationIdAndStatus(orgId, "TRANSFERRED");
    }
}
