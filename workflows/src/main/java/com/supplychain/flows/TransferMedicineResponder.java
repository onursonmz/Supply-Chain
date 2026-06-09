package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import com.supplychain.states.MedicineState;
import net.corda.core.contracts.ContractState;
import net.corda.core.flows.*;
import net.corda.core.transactions.LedgerTransaction;
import net.corda.core.transactions.SignedTransaction;
import org.jetbrains.annotations.NotNull;

/**
 * TransferMedicineResponder is called on the new owner's node during a medicine transfer.
 * Verifies that this node is the intended new owner, signs the transaction, then records it.
 */
@InitiatedBy(TransferMedicineFlow.class)
public class TransferMedicineResponder extends FlowLogic<SignedTransaction> {

    private final FlowSession counterpartySession;

    public TransferMedicineResponder(FlowSession counterpartySession) {
        this.counterpartySession = counterpartySession;
    }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {

        SignedTransaction signedTx = subFlow(new SignTransactionFlow(counterpartySession) {
            @Override
            protected void checkTransaction(@NotNull SignedTransaction stx) throws FlowException {
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
                if (!(outputState instanceof MedicineState)) {
                    throw new FlowException("Expected output to be a MedicineState.");
                }

                MedicineState medicine = (MedicineState) outputState;
                if (!medicine.getOwner().equals(getOurIdentity())) {
                    throw new FlowException("This transfer is not addressed to us.");
                }
            }
        });

        return subFlow(new ReceiveFinalityFlow(counterpartySession, signedTx.getId()));
    }
}
