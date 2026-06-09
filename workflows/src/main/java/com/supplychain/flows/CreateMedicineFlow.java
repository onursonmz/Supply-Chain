package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import com.supplychain.contracts.MedicineContract;
import com.supplychain.states.MedicineState;
import net.corda.core.contracts.Command;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.flows.*;
import net.corda.core.identity.Party;
import net.corda.core.transactions.SignedTransaction;
import net.corda.core.transactions.TransactionBuilder;
import net.corda.core.utilities.ProgressTracker;

import java.util.Collections;

@InitiatingFlow
@StartableByRPC
public class CreateMedicineFlow extends FlowLogic<SignedTransaction> {

    private final String medicineName;
    private final String gtin;
    private final String batchNumber;
    private final String serialNumber;
    private final String manufacturerName;
    private final String expiryDate;
    private final String category;
    private final Party  owner;
    private final String ownerOrganizationId;
    private final String ownerOrganizationName;
    private final String description;
    private final String strength;
    private final String medicineForm;
    private final String storageCondition;

    private static final ProgressTracker.Step BUILDING_TX   = new ProgressTracker.Step("Building transaction.");
    private static final ProgressTracker.Step VERIFYING_TX  = new ProgressTracker.Step("Verifying transaction.");
    private static final ProgressTracker.Step SIGNING_TX    = new ProgressTracker.Step("Signing transaction.");
    private static final ProgressTracker.Step FINALISING_TX = new ProgressTracker.Step("Finalising transaction.") {
        @Override public ProgressTracker childProgressTracker() { return FinalityFlow.Companion.tracker(); }
    };

    private final ProgressTracker progressTracker =
            new ProgressTracker(BUILDING_TX, VERIFYING_TX, SIGNING_TX, FINALISING_TX);

    public CreateMedicineFlow(String medicineName, String gtin, String batchNumber, String serialNumber,
                               String manufacturerName, String expiryDate, String category, Party owner,
                               String ownerOrganizationId, String ownerOrganizationName,
                               String description, String strength, String medicineForm, String storageCondition) {
        this.medicineName          = medicineName;
        this.gtin                  = gtin;
        this.batchNumber           = batchNumber;
        this.serialNumber          = serialNumber;
        this.manufacturerName      = manufacturerName;
        this.expiryDate            = expiryDate;
        this.category              = category;
        this.owner                 = owner;
        this.ownerOrganizationId   = ownerOrganizationId;
        this.ownerOrganizationName = ownerOrganizationName;
        this.description           = description;
        this.strength              = strength;
        this.medicineForm          = medicineForm;
        this.storageCondition      = storageCondition;
    }

    @Override public ProgressTracker getProgressTracker() { return progressTracker; }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {
        progressTracker.setCurrentStep(BUILDING_TX);
        Party notary = getServiceHub().getNetworkMapCache().getNotaryIdentities().get(0);

        MedicineState outputState = new MedicineState(
                new UniqueIdentifier(),
                medicineName, gtin, batchNumber, serialNumber,
                manufacturerName, expiryDate, category,
                owner, ownerOrganizationId, ownerOrganizationName,
                MedicineState.STATUS_CREATED, null,
                description, strength, medicineForm, storageCondition
        );

        Command<MedicineContract.Commands.Create> command = new Command<>(
                new MedicineContract.Commands.Create(),
                Collections.singletonList(owner.getOwningKey())
        );

        TransactionBuilder txBuilder = new TransactionBuilder(notary)
                .addOutputState(outputState, MedicineContract.ID)
                .addCommand(command);

        progressTracker.setCurrentStep(VERIFYING_TX);
        txBuilder.verify(getServiceHub());

        progressTracker.setCurrentStep(SIGNING_TX);
        SignedTransaction signedTx = getServiceHub().signInitialTransaction(txBuilder);

        progressTracker.setCurrentStep(FINALISING_TX);
        if (owner.equals(getOurIdentity())) {
            return subFlow(new FinalityFlow(signedTx, Collections.emptyList(), FINALISING_TX.childProgressTracker()));
        } else {
            FlowSession ownerSession = initiateFlow(owner);
            return subFlow(new FinalityFlow(signedTx, Collections.singletonList(ownerSession), FINALISING_TX.childProgressTracker()));
        }
    }
}
