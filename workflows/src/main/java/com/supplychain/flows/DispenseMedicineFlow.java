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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@InitiatingFlow
@StartableByRPC
public class DispenseMedicineFlow extends FlowLogic<SignedTransaction> {

    private final String linearIdStr;
    private final String prescriptionHash;

    private static final ProgressTracker.Step QUERYING_VAULT  = new ProgressTracker.Step("Querying vault.");
    private static final ProgressTracker.Step BUILDING_TX     = new ProgressTracker.Step("Building transaction.");
    private static final ProgressTracker.Step VERIFYING_TX    = new ProgressTracker.Step("Verifying transaction.");
    private static final ProgressTracker.Step SIGNING_TX      = new ProgressTracker.Step("Signing transaction.");
    private static final ProgressTracker.Step FINALISING_TX   = new ProgressTracker.Step("Finalising transaction.") {
        @Override public ProgressTracker childProgressTracker() { return FinalityFlow.Companion.tracker(); }
    };

    private final ProgressTracker progressTracker =
            new ProgressTracker(QUERYING_VAULT, BUILDING_TX, VERIFYING_TX, SIGNING_TX, FINALISING_TX);

    public DispenseMedicineFlow(String linearIdStr, String prescriptionHash) {
        this.linearIdStr      = linearIdStr;
        this.prescriptionHash = prescriptionHash;
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
            throw new FlowException("Only the current owner (pharmacy) can dispense this medicine.");
        }
        if (!MedicineState.STATUS_AT_PHARMACY.equals(input.getStatus())) {
            throw new FlowException("Medicine must be AT_PHARMACY to dispense. Current status: " + input.getStatus());
        }

        progressTracker.setCurrentStep(BUILDING_TX);
        Party notary = inputRef.getState().getNotary();

        MedicineState output = new MedicineState(
                input.getLinearId(),
                input.getMedicineName(), input.getGtin(),
                input.getBatchNumber(), input.getSerialNumber(),
                input.getManufacturerName(), input.getExpiryDate(), input.getCategory(),
                input.getOwner(),
                input.getOwnerOrganizationId(), input.getOwnerOrganizationName(),
                MedicineState.STATUS_DISPENSED_TO_PATIENT,
                prescriptionHash,
                input.getDescription(), input.getStrength(),
                input.getMedicineForm(), input.getStorageCondition()
        );

        Command<MedicineContract.Commands.Dispense> command = new Command<>(
                new MedicineContract.Commands.Dispense(),
                Collections.singletonList(input.getOwner().getOwningKey())
        );

        TransactionBuilder txBuilder = new TransactionBuilder(notary)
                .addInputState(inputRef)
                .addOutputState(output, MedicineContract.ID)
                .addCommand(command);

        progressTracker.setCurrentStep(VERIFYING_TX);
        txBuilder.verify(getServiceHub());

        progressTracker.setCurrentStep(SIGNING_TX);
        SignedTransaction signedTx = getServiceHub().signInitialTransaction(txBuilder);

        progressTracker.setCurrentStep(FINALISING_TX);
        return subFlow(new FinalityFlow(signedTx, Collections.emptyList(), FINALISING_TX.childProgressTracker()));
    }
}
