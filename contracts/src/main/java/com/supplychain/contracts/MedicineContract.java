package com.supplychain.contracts;

import com.supplychain.states.MedicineState;
import net.corda.core.contracts.CommandData;
import net.corda.core.contracts.Contract;
import net.corda.core.transactions.LedgerTransaction;

import java.util.List;

import static net.corda.core.contracts.ContractsDSL.requireThat;

public class MedicineContract implements Contract {

    public static final String ID = "com.supplychain.contracts.MedicineContract";

    @Override
    public void verify(LedgerTransaction tx) {
        if (tx.getCommands().size() != 1) {
            throw new IllegalArgumentException("Transaction must have exactly one command.");
        }

        CommandData command = tx.getCommands().get(0).getValue();

        if      (command instanceof Commands.Create)   verifyCreate(tx);
        else if (command instanceof Commands.Transfer)  verifyTransfer(tx);
        else if (command instanceof Commands.Dispense)  verifyDispense(tx);
        else if (command instanceof Commands.Recall)    verifyRecall(tx);
        else throw new IllegalArgumentException("Unknown command: " + command);
    }

    private void verifyCreate(LedgerTransaction tx) {
        requireThat(require -> {
            require.using("Create: No inputs allowed.", tx.getInputs().isEmpty());
            require.using("Create: Exactly one output.", tx.getOutputs().size() == 1);

            MedicineState out = tx.outputsOfType(MedicineState.class).get(0);
            require.using("Create: medicineName blank.",    notBlank(out.getMedicineName()));
            require.using("Create: batchNumber blank.",     notBlank(out.getBatchNumber()));
            require.using("Create: serialNumber blank.",    notBlank(out.getSerialNumber()));
            require.using("Create: manufacturerName blank.",notBlank(out.getManufacturerName()));
            require.using("Create: owner null.",            out.getOwner() != null);
            require.using("Create: initial status must be CREATED.",
                    MedicineState.STATUS_CREATED.equals(out.getStatus()));
            require.using("Create: owner must sign.",
                    tx.getCommands().get(0).getSigners().contains(out.getOwner().getOwningKey()));
            return null;
        });
    }

    private void verifyTransfer(LedgerTransaction tx) {
        requireThat(require -> {
            require.using("Transfer: Exactly one input.",  tx.getInputs().size() == 1);
            require.using("Transfer: Exactly one output.", tx.getOutputs().size() == 1);

            MedicineState in  = tx.inputsOfType(MedicineState.class).get(0);
            MedicineState out = tx.outputsOfType(MedicineState.class).get(0);

            require.using("Transfer: linearId unchanged.",     in.getLinearId().equals(out.getLinearId()));
            require.using("Transfer: owner must change.",      !in.getOwner().equals(out.getOwner()));
            require.using("Transfer: medicineName unchanged.", in.getMedicineName().equals(out.getMedicineName()));
            require.using("Transfer: batchNumber unchanged.",  in.getBatchNumber().equals(out.getBatchNumber()));
            require.using("Transfer: serialNumber unchanged.", in.getSerialNumber().equals(out.getSerialNumber()));
            require.using("Transfer: input status must allow transfer.",
                    MedicineState.STATUS_CREATED.equals(in.getStatus()) ||
                    MedicineState.STATUS_IN_DISTRIBUTION.equals(in.getStatus()));
            require.using("Transfer: output status must be IN_DISTRIBUTION or AT_PHARMACY.",
                    MedicineState.STATUS_IN_DISTRIBUTION.equals(out.getStatus()) ||
                    MedicineState.STATUS_AT_PHARMACY.equals(out.getStatus()));

            List<java.security.PublicKey> signers = tx.getCommands().get(0).getSigners();
            require.using("Transfer: old owner must sign.", signers.contains(in.getOwner().getOwningKey()));
            require.using("Transfer: new owner must sign.", signers.contains(out.getOwner().getOwningKey()));
            return null;
        });
    }

    private void verifyDispense(LedgerTransaction tx) {
        requireThat(require -> {
            require.using("Dispense: Exactly one input.",  tx.getInputs().size() == 1);
            require.using("Dispense: Exactly one output.", tx.getOutputs().size() == 1);

            MedicineState in  = tx.inputsOfType(MedicineState.class).get(0);
            MedicineState out = tx.outputsOfType(MedicineState.class).get(0);

            require.using("Dispense: input must be AT_PHARMACY.",
                    MedicineState.STATUS_AT_PHARMACY.equals(in.getStatus()));
            require.using("Dispense: output must be DISPENSED_TO_PATIENT.",
                    MedicineState.STATUS_DISPENSED_TO_PATIENT.equals(out.getStatus()));
            require.using("Dispense: linearId unchanged.",     in.getLinearId().equals(out.getLinearId()));
            require.using("Dispense: owner unchanged (pharmacy retains).", in.getOwner().equals(out.getOwner()));
            require.using("Dispense: medicineName unchanged.", in.getMedicineName().equals(out.getMedicineName()));
            require.using("Dispense: serialNumber unchanged.", in.getSerialNumber().equals(out.getSerialNumber()));
            // prescriptionReference holds the privacy hash — must be present
            require.using("Dispense: prescription proof required.",
                    out.getPrescriptionReference() != null && !out.getPrescriptionReference().isBlank());
            require.using("Dispense: pharmacy must sign.",
                    tx.getCommands().get(0).getSigners().contains(out.getOwner().getOwningKey()));
            return null;
        });
    }

    private void verifyRecall(LedgerTransaction tx) {
        requireThat(require -> {
            require.using("Recall: Exactly one input.",  tx.getInputs().size() == 1);
            require.using("Recall: Exactly one output.", tx.getOutputs().size() == 1);

            MedicineState in  = tx.inputsOfType(MedicineState.class).get(0);
            MedicineState out = tx.outputsOfType(MedicineState.class).get(0);

            require.using("Recall: cannot recall already recalled medicine.",
                    !MedicineState.STATUS_RECALLED.equals(in.getStatus()));
            require.using("Recall: cannot recall dispensed medicine.",
                    !MedicineState.STATUS_DISPENSED_TO_PATIENT.equals(in.getStatus()));
            require.using("Recall: output must be RECALLED.",
                    MedicineState.STATUS_RECALLED.equals(out.getStatus()));
            require.using("Recall: linearId unchanged.",     in.getLinearId().equals(out.getLinearId()));
            require.using("Recall: serialNumber unchanged.", in.getSerialNumber().equals(out.getSerialNumber()));
            require.using("Recall: current owner must sign.",
                    tx.getCommands().get(0).getSigners().contains(in.getOwner().getOwningKey()));
            return null;
        });
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }

    public interface Commands extends CommandData {
        class Create   implements Commands {}
        class Transfer implements Commands {}
        class Dispense implements Commands {}
        class Recall   implements Commands {}
    }
}
