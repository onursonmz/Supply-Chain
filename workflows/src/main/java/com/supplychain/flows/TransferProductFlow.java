package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import com.supplychain.contracts.ProductContract;
import com.supplychain.states.ProductState;
import net.corda.core.contracts.Command;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.flows.*;
import net.corda.core.identity.Party;
import net.corda.core.node.services.Vault;
import net.corda.core.node.services.vault.QueryCriteria;
import net.corda.core.transactions.SignedTransaction;
import net.corda.core.transactions.TransactionBuilder;
import net.corda.core.utilities.ProgressTracker;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

/**
 * TransferProductFlow transfers ownership of a product to a new owner.
 *
 * Usage from Corda shell:
 *   flow start TransferProductFlow linearId: "<uuid>", newOwner: "O=Distributor,L=Paris,C=FR"
 */
@InitiatingFlow
@StartableByRPC
public class TransferProductFlow extends FlowLogic<SignedTransaction> {

    private final UniqueIdentifier linearId;
    private final Party newOwner;

    private static final ProgressTracker.Step QUERYING_VAULT  = new ProgressTracker.Step("Querying vault for product.");
    private static final ProgressTracker.Step BUILDING_TX     = new ProgressTracker.Step("Building transaction.");
    private static final ProgressTracker.Step VERIFYING_TX    = new ProgressTracker.Step("Verifying transaction.");
    private static final ProgressTracker.Step SIGNING_TX      = new ProgressTracker.Step("Signing transaction.");
    private static final ProgressTracker.Step COLLECTING_SIGS = new ProgressTracker.Step("Collecting signatures from new owner.") {
        @Override public ProgressTracker childProgressTracker() {
            return CollectSignaturesFlow.Companion.tracker();
        }
    };
    private static final ProgressTracker.Step FINALISING_TX   = new ProgressTracker.Step("Finalising transaction.") {
        @Override public ProgressTracker childProgressTracker() {
            return FinalityFlow.Companion.tracker();
        }
    };

    private final ProgressTracker progressTracker = new ProgressTracker(
            QUERYING_VAULT, BUILDING_TX, VERIFYING_TX, SIGNING_TX, COLLECTING_SIGS, FINALISING_TX
    );

    public TransferProductFlow(UniqueIdentifier linearId, Party newOwner) {
        this.linearId = linearId;
        this.newOwner = newOwner;
    }

    @Override
    public ProgressTracker getProgressTracker() {
        return progressTracker;
    }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {

        // Step 1 – Query vault for the product
        progressTracker.setCurrentStep(QUERYING_VAULT);

        // LinearStateQueryCriteria expects a List<UUID>, not List<UniqueIdentifier>
        List<UUID> uuidList = new ArrayList<>();
        uuidList.add(linearId.getId());

        QueryCriteria criteria = new QueryCriteria.LinearStateQueryCriteria(
                null,
                uuidList,
                null,
                Vault.StateStatus.UNCONSUMED
        );

        List<StateAndRef<ProductState>> results =
                getServiceHub().getVaultService().queryBy(ProductState.class, criteria).getStates();

        if (results.isEmpty()) {
            throw new FlowException("Product with linearId " + linearId + " not found in vault.");
        }

        StateAndRef<ProductState> inputStateAndRef = results.get(0);
        ProductState inputState = inputStateAndRef.getState().getData();

        // Verify that the calling node is the current owner
        if (!inputState.getOwner().equals(getOurIdentity())) {
            throw new FlowException("Only the current owner can transfer this product.");
        }

        // Step 2 – Build transaction
        progressTracker.setCurrentStep(BUILDING_TX);

        Party notary = inputStateAndRef.getState().getNotary();

        // Build the output state with the new owner and TRANSFERRED status
        ProductState outputState = new ProductState(
                inputState.getLinearId(),
                inputState.getProductName(),
                inputState.getSerialNumber(),
                newOwner,
                ProductState.STATUS_TRANSFERRED
        );

        // Both old owner and new owner must sign
        Command<ProductContract.Commands.Transfer> command = new Command<>(
                new ProductContract.Commands.Transfer(),
                Arrays.asList(inputState.getOwner().getOwningKey(), newOwner.getOwningKey())
        );

        TransactionBuilder txBuilder = new TransactionBuilder(notary)
                .addInputState(inputStateAndRef)
                .addOutputState(outputState, ProductContract.ID)
                .addCommand(command);

        // Step 3 – Verify
        progressTracker.setCurrentStep(VERIFYING_TX);
        txBuilder.verify(getServiceHub());

        // Step 4 – Sign with current owner's key
        progressTracker.setCurrentStep(SIGNING_TX);
        SignedTransaction partiallySignedTx = getServiceHub().signInitialTransaction(txBuilder);

        // Step 5 – Collect new owner's signature
        progressTracker.setCurrentStep(COLLECTING_SIGS);
        FlowSession newOwnerSession = initiateFlow(newOwner);
        SignedTransaction fullySignedTx = subFlow(new CollectSignaturesFlow(
                partiallySignedTx,
                Collections.singletonList(newOwnerSession),
                COLLECTING_SIGS.childProgressTracker()
        ));

        // Step 6 – Finalise
        progressTracker.setCurrentStep(FINALISING_TX);
        return subFlow(new FinalityFlow(
                fullySignedTx,
                Collections.singletonList(newOwnerSession),
                FINALISING_TX.childProgressTracker()
        ));
    }
}
