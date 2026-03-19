package com.supplychain.states;

import com.supplychain.contracts.ProductContract;
import net.corda.core.contracts.BelongsToContract;
import net.corda.core.contracts.LinearState;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.identity.AbstractParty;
import net.corda.core.identity.Party;
import org.jetbrains.annotations.NotNull;

import java.util.Collections;
import java.util.List;

/**
 * ProductState represents a product on the Corda ledger.
 * It tracks who currently owns the product and its lifecycle status.
 */
@BelongsToContract(ProductContract.class)
public class ProductState implements LinearState {

    private final UniqueIdentifier linearId;
    private final String productName;
    private final String serialNumber;
    private final Party owner;
    private final String status;

    // Valid status values
    public static final String STATUS_CREATED = "CREATED";
    public static final String STATUS_TRANSFERRED = "TRANSFERRED";

    public ProductState(
            UniqueIdentifier linearId,
            String productName,
            String serialNumber,
            Party owner,
            String status) {
        this.linearId = linearId;
        this.productName = productName;
        this.serialNumber = serialNumber;
        this.owner = owner;
        this.status = status;
    }

    @NotNull
    @Override
    public UniqueIdentifier getLinearId() {
        return linearId;
    }

    /**
     * Only the current owner is a participant on this state.
     * This means only the owner's node holds this state in its vault.
     */
    @NotNull
    @Override
    public List<AbstractParty> getParticipants() {
        return Collections.singletonList(owner);
    }

    public String getProductName() {
        return productName;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public Party getOwner() {
        return owner;
    }

    public String getStatus() {
        return status;
    }

    @Override
    public String toString() {
        return "ProductState{" +
                "linearId=" + linearId +
                ", productName='" + productName + '\'' +
                ", serialNumber='" + serialNumber + '\'' +
                ", owner=" + owner.getName() +
                ", status='" + status + '\'' +
                '}';
    }
}
