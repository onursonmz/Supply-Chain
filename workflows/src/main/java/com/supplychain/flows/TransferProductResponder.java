package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import com.supplychain.states.ProductState;
import net.corda.core.contracts.ContractState;
import net.corda.core.flows.*;
import net.corda.core.transactions.LedgerTransaction;
import net.corda.core.transactions.SignedTransaction;
import org.jetbrains.annotations.NotNull;

/**
 * TransferProductResponder is called on the new owner's node when a transfer is initiated.
 *
 * It:
 *   1. Checks the transaction looks valid (the new owner is actually this node).
 *   2. Signs to approve the transfer.
 *   3. Receives the finalised transaction and saves it to the vault.
 */
@InitiatedBy(TransferProductFlow.class)
public class TransferProductResponder extends FlowLogic<SignedTransaction> {

    private final FlowSession counterpartySession;

    public TransferProductResponder(FlowSession counterpartySession) {
        this.counterpartySession = counterpartySession;
    }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {

        // Sign the transaction after verifying basic intent
        SignedTransaction signedTx = subFlow(new SignTransactionFlow(counterpartySession) {
            @Override
            protected void checkTransaction(@NotNull SignedTransaction stx) throws FlowException {
                // Basic sanity check: there should be one ProductState output
                // and the new owner should be this node.
                LedgerTransaction ltx;
                try {
                    ltx = stx.toLedgerTransaction(getServiceHub(), false);
                } catch (Exception e) {
                    throw new FlowException("Could not verify transaction: " + e.getMessage(), e);
                }

                if (ltx.getOutputs().isEmpty()) {
                    throw new FlowException("Expected at least one output state.");
                }

                ContractState outputState = ltx.getOutputs().get(0).getData();
                if (!(outputState instanceof ProductState)) {
                    throw new FlowException("Expected output to be a ProductState.");
                }

                ProductState product = (ProductState) outputState;
                if (!product.getOwner().equals(getOurIdentity())) {
                    throw new FlowException("This transfer is not addressed to us.");
                }
            }
        });

        // Receive the finalised transaction from FinalityFlow and record it
        return subFlow(new ReceiveFinalityFlow(counterpartySession, signedTx.getId()));
    }
}
