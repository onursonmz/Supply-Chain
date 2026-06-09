package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import net.corda.core.flows.*;
import net.corda.core.transactions.SignedTransaction;

/**
 * CreateMedicineResponder receives the finalised transaction from CreateMedicineFlow.
 * Only called when the medicine owner is on a different node than the initiator.
 */
@InitiatedBy(CreateMedicineFlow.class)
public class CreateMedicineResponder extends FlowLogic<SignedTransaction> {

    private final FlowSession counterpartySession;

    public CreateMedicineResponder(FlowSession counterpartySession) {
        this.counterpartySession = counterpartySession;
    }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {
        return subFlow(new ReceiveFinalityFlow(counterpartySession));
    }
}
