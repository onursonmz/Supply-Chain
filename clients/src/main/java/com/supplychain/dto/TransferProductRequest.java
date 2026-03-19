package com.supplychain.dto;

/**
 * Request body for POST /api/products/transfer
 */
public class TransferProductRequest {
    private String linearId;
    private String newOwner;   // short name: "Distributor", "Retailer", "Manufacturer"

    public TransferProductRequest() {}

    public String getLinearId() { return linearId; }
    public void setLinearId(String linearId) { this.linearId = linearId; }

    public String getNewOwner() { return newOwner; }
    public void setNewOwner(String newOwner) { this.newOwner = newOwner; }
}
