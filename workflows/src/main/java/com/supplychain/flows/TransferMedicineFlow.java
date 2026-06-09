package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import com.supplychain.contracts.MedicineContract;
import com.supplychain.states.MedicineState;
import net.corda.core.contracts.Command;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.flows.*;
import net.corda.core.identity.Party;
import net.corda.core.node.services.Vault;
import net.corda.core.node.services.vault.QueryCriteria;
import net.corda.core.transactions.SignedTransaction;
import net.corda.core.transactions.TransactionBuilder;
import net.corda.core.utilities.ProgressTracker;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@InitiatingFlow
@StartableByRPC
public class TransferMedicineFlow extends FlowLogic<SignedTransaction> {

    private final String      linearIdStr;
    private final Party       newOwner;
    private final String      newOwnerOrganizationId;
    private final String      newOwnerOrganizationName;

    private static final ProgressTracker.Step QUERYING_VAULT  = new ProgressTracker.Step("Querying vault.");
    private static final ProgressTracker.Step BUILDING_TX     = new ProgressTracker.Step("Building transaction.");
    private static final ProgressTracker.Step VERIFYING_TX    = new ProgressTracker.Step("Verifying transaction.");
    private static final ProgressTracker.Step SIGNING_TX      = new ProgressTracker.Step("Signing transaction.");
    private static final ProgressTracker.Step COLLECTING_SIGS = new ProgressTracker.Step("Collecting signatures.") {
        @Override public ProgressTracker childProgressTracker() { return CollectSignaturesFlow.Companion.tracker(); }
    };
    private static final ProgressTracker.Step FINALISING_TX   = new ProgressTracker.Step("Finalising transaction.") {
        @Override public ProgressTracker childProgressTracker() { return FinalityFlow.Companion.tracker(); }
    };

    private final ProgressTracker progressTracker = new ProgressTracker(
            QUERYING_VAULT, BUILDING_TX, VERIFYING_TX, SIGNING_TX, COLLECTING_SIGS, FINALISING_TX);

    public TransferMedicineFlow(String linearIdStr, Party newOwner,
                                 String newOwnerOrganizationId, String newOwnerOrganizationName) {
        this.linearIdStr             = linearIdStr;
        this.newOwner                = newOwner;
        this.newOwnerOrganizationId   = newOwnerOrganizationId;
        this.newOwnerOrganizationName = newOwnerOrganizationName;
    }

    @Override public ProgressTracker getProgressTracker() { return progressTracker; }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {

        progressTracker.setCurrentStep(QUERYING_VAULT);
        List<UUID> uuidList = new ArrayList<>();
        uuidList.add(UUID.fromString(linearIdStr));

        QueryCriteria criteria = new QueryCriteria.LinearStateQueryCriteria(
                null, uuidList, null, Vault.StateStatus.UNCONSUMED);

        List<StateAndRef<MedicineState>> results =
                getServiceHub().getVaultService().queryBy(MedicineState.class, criteria).getStates();

        if (results.isEmpty()) {
            throw new FlowException("Medicine " + linearIdStr + " not found in vault.");
        }

        StateAndRef<MedicineState> inputRef = results.get(0);
        MedicineState input = inputRef.getState().getData();

        if (!input.getOwner().equals(getOurIdentity())) {
            throw new FlowException("Only the current owner can transfer this medicine.");
        }

        String orgName  = newOwner.getName().getOrganisation();
        String newStatus = orgName.contains("Pharmacy")
                ? MedicineState.STATUS_AT_PHARMACY
                : MedicineState.STATUS_IN_DISTRIBUTION;

        progressTracker.setCurrentStep(BUILDING_TX);
        Party notary = inputRef.getState().getNotary();

        MedicineState output = new MedicineState(
                input.getLinearId(),
                input.getMedicineName(), input.getGtin(),
                input.getBatchNumber(), input.getSerialNumber(),
                input.getManufacturerName(), input.getExpiryDate(), input.getCategory(),
                newOwner, newOwnerOrganizationId, newOwnerOrganizationName,
                newStatus, null,
                input.getDescription(), input.getStrength(),
                input.getMedicineForm(), input.getStorageCondition()
        );

        Command<MedicineContract.Commands.Transfer> command = new Command<>(
                new MedicineContract.Commands.Transfer(),
                Arrays.asList(input.getOwner().getOwningKey(), newOwner.getOwningKey())
        );

        TransactionBuilder txBuilder = new TransactionBuilder(notary)
                .addInputState(inputRef)
                .addOutputState(output, MedicineContract.ID)
                .addCommand(command);

        progressTracker.setCurrentStep(VERIFYING_TX);
        txBuilder.verify(getServiceHub());

        progressTracker.setCurrentStep(SIGNING_TX);
        SignedTransaction partial = getServiceHub().signInitialTransaction(txBuilder);

        progressTracker.setCurrentStep(COLLECTING_SIGS);
        FlowSession newOwnerSession = initiateFlow(newOwner);
        SignedTransaction fullySigned = subFlow(new CollectSignaturesFlow(
                partial, Collections.singletonList(newOwnerSession), COLLECTING_SIGS.childProgressTracker()));

        progressTracker.setCurrentStep(FINALISING_TX);
        return subFlow(new FinalityFlow(
                fullySigned, Collections.singletonList(newOwnerSession), FINALISING_TX.childProgressTracker()));
    }
}
