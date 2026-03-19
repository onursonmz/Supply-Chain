package com.supplychain.contracts;

import com.supplychain.states.ProductState;
import net.corda.core.contracts.CommandData;
import net.corda.core.contracts.Contract;
import net.corda.core.transactions.LedgerTransaction;

import static net.corda.core.contracts.ContractsDSL.requireThat;

/**
 * ProductContract enforces the business rules for creating and transferring products.
 *
 * Commands:
 *   - Create: Records a new product on the ledger.
 *   - Transfer: Moves ownership of a product from one party to another.
 */
public class ProductContract implements Contract {

    public static final String ID = "com.supplychain.contracts.ProductContract";

    @Override
    public void verify(LedgerTransaction tx) {

        // There must be exactly one command in the transaction
        if (tx.getCommands().size() != 1) {
            throw new IllegalArgumentException("Transaction must have exactly one command.");
        }

        CommandData command = tx.getCommands().get(0).getValue();

        if (command instanceof Commands.Create) {
            verifyCreate(tx);
        } else if (command instanceof Commands.Transfer) {
            verifyTransfer(tx);
        } else {
            throw new IllegalArgumentException("Unknown command: " + command);
        }
    }

    // -------------------------------------------------------------------------
    // Create verification
    // -------------------------------------------------------------------------
    private void verifyCreate(LedgerTransaction tx) {
        requireThat(require -> {
            require.using("Create: No input states allowed.",
                    tx.getInputs().isEmpty());

            require.using("Create: Must have exactly one output state.",
                    tx.getOutputs().size() == 1);

            ProductState output = tx.outputsOfType(ProductState.class).get(0);

            require.using("Create: productName must not be blank.",
                    output.getProductName() != null && !output.getProductName().isBlank());

            require.using("Create: serialNumber must not be blank.",
                    output.getSerialNumber() != null && !output.getSerialNumber().isBlank());

            require.using("Create: owner must not be null.",
                    output.getOwner() != null);

            require.using("Create: status must be CREATED.",
                    ProductState.STATUS_CREATED.equals(output.getStatus()));

            require.using("Create: Owner must sign the transaction.",
                    tx.getCommands().get(0).getSigners().contains(output.getOwner().getOwningKey()));

            return null;
        });
    }

    // -------------------------------------------------------------------------
    // Transfer verification
    // -------------------------------------------------------------------------
    private void verifyTransfer(LedgerTransaction tx) {
        requireThat(require -> {
            require.using("Transfer: Must have exactly one input state.",
                    tx.getInputs().size() == 1);

            require.using("Transfer: Must have exactly one output state.",
                    tx.getOutputs().size() == 1);

            ProductState input = tx.inputsOfType(ProductState.class).get(0);
            ProductState output = tx.outputsOfType(ProductState.class).get(0);

            require.using("Transfer: linearId must remain the same.",
                    input.getLinearId().equals(output.getLinearId()));

            require.using("Transfer: Owner must change.",
                    !input.getOwner().equals(output.getOwner()));

            require.using("Transfer: output status must be TRANSFERRED.",
                    ProductState.STATUS_TRANSFERRED.equals(output.getStatus()));

            require.using("Transfer: productName must not change.",
                    input.getProductName().equals(output.getProductName()));

            require.using("Transfer: serialNumber must not change.",
                    input.getSerialNumber().equals(output.getSerialNumber()));

            java.util.List<java.security.PublicKey> signers = tx.getCommands().get(0).getSigners();

            require.using("Transfer: Old owner must sign.",
                    signers.contains(input.getOwner().getOwningKey()));

            require.using("Transfer: New owner must sign.",
                    signers.contains(output.getOwner().getOwningKey()));

            return null;
        });
    }

    // -------------------------------------------------------------------------
    // Commands
    // -------------------------------------------------------------------------
    public interface Commands extends CommandData {
        class Create implements Commands {}
        class Transfer implements Commands {}
    }
}
