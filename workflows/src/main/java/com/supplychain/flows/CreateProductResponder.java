package com.supplychain.flows;

import co.paralleluniverse.fibers.Suspendable;
import net.corda.core.flows.*;
import net.corda.core.transactions.SignedTransaction;

/**
 * CreateProductResponder receives the finalised transaction from CreateProductFlow.
 * It is only called when the product owner is on a different node than the initiator.
 * No additional signing is required here because the Create command only requires
 * the owner's signature, which is provided by the initiating flow.
 */
@InitiatedBy(CreateProductFlow.class)
public class CreateProductResponder extends FlowLogic<SignedTransaction> {

    private final FlowSession counterpartySession;

    public CreateProductResponder(FlowSession counterpartySession) {
        this.counterpartySession = counterpartySession;
    }

    @Suspendable
    @Override
    public SignedTransaction call() throws FlowException {
        // Simply receive the finalised transaction and record it in the vault
        return subFlow(new ReceiveFinalityFlow(counterpartySession));
    }
}
