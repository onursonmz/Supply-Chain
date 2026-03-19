package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import com.supplychain.contracts.ProductContract;
import com.supplychain.states.ProductState;
import net.corda.core.contracts.Command;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.flows.*;
import net.corda.core.identity.Party;
import net.corda.core.transactions.SignedTransaction;
import net.corda.core.transactions.TransactionBuilder;
import net.corda.core.utilities.ProgressTracker;

import java.util.Collections;

/**
 * CreateProductFlow creates a new product on the Corda ledger.
 *
 * Usage from Corda shell:
 *   flow start CreateProductFlow productName: "Laptop", serialNumber: "SN-001", owner: "O=Manufacturer,L=New York,C=US"
 */
@InitiatingFlow
@StartableByRPC
public class CreateProductFlow extends FlowLogic<SignedTransaction> {

    private final String productName;
    private final String serialNumber;
    private final Party owner;

    // Progress tracker so the shell shows what step is running
    private static final ProgressTracker.Step BUILDING_TX   = new ProgressTracker.Step("Building transaction.");
    private static final ProgressTracker.Step VERIFYING_TX  = new ProgressTracker.Step("Verifying transaction.");
    private static final ProgressTracker.Step SIGNING_TX    = new ProgressTracker.Step("Signing transaction.");
    private static final ProgressTracker.Step FINALISING_TX = new ProgressTracker.Step("Finalising transaction.") {
        @Override public ProgressTracker childProgressTracker() {
            return FinalityFlow.Companion.tracker();
        }
    };

    private final ProgressTracker progressTracker = new ProgressTracker(
            BUILDING_TX, VERIFYING_TX, SIGNING_TX, FINALISING_TX
    );

    public CreateProductFlow(String productName, String serialNumber, Party owner) {
        this.productName = productName;
        this.serialNumber = serialNumber;
        this.owner = owner;
    }

    @Override
    public ProgressTracker getProgressTracker() {
        return progressTracker;
    }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {

        // Step 1 – Build transaction
        progressTracker.setCurrentStep(BUILDING_TX);

        // Use the first available notary on the network
        Party notary = getServiceHub().getNetworkMapCache().getNotaryIdentities().get(0);

        // Create the output state
        ProductState outputState = new ProductState(
                new UniqueIdentifier(),
                productName,
                serialNumber,
                owner,
                ProductState.STATUS_CREATED
        );

        // Create the Create command; the owner must sign
        Command<ProductContract.Commands.Create> command = new Command<>(
                new ProductContract.Commands.Create(),
                Collections.singletonList(owner.getOwningKey())
        );

        // Assemble the transaction
        TransactionBuilder txBuilder = new TransactionBuilder(notary)
                .addOutputState(outputState, ProductContract.ID)
                .addCommand(command);

        // Step 2 – Verify
        progressTracker.setCurrentStep(VERIFYING_TX);
        txBuilder.verify(getServiceHub());

        // Step 3 – Sign with the initiating node's key
        progressTracker.setCurrentStep(SIGNING_TX);
        SignedTransaction signedTx = getServiceHub().signInitialTransaction(txBuilder);

        // Step 4 – Finalise (distribute to participants)
        progressTracker.setCurrentStep(FINALISING_TX);

        // If the owner is the same node as the initiator, no sessions needed.
        // If the owner is a different node, open a session so FinalityFlow can deliver the tx.
        if (owner.equals(getOurIdentity())) {
            return subFlow(new FinalityFlow(signedTx, Collections.emptyList(), FINALISING_TX.childProgressTracker()));
        } else {
            FlowSession ownerSession = initiateFlow(owner);
            return subFlow(new FinalityFlow(signedTx, Collections.singletonList(ownerSession), FINALISING_TX.childProgressTracker()));
        }
    }
}
