package com.supplychain.dto;

import com.supplychain.states.ProductState;

/**
 * JSON response object representing a ProductState from the vault.
 */
public class ProductResponse {
    private String linearId;
    private String productName;
    private String serialNumber;
    private String owner;
    private String status;

    public ProductResponse() {}

    /**
     * Build a response from a ProductState.
     */
    public static ProductResponse from(ProductState state) {
        ProductResponse r = new ProductResponse();
        r.linearId     = state.getLinearId().getId().toString();
        r.productName  = state.getProductName();
        r.serialNumber = state.getSerialNumber();
        r.owner        = state.getOwner().getName().getOrganisation();
        r.status       = state.getStatus();
        return r;
    }

    public String getLinearId()     { return linearId; }
    public String getProductName()  { return productName; }
    public String getSerialNumber() { return serialNumber; }
    public String getOwner()        { return owner; }
    public String getStatus()       { return status; }

    public void setLinearId(String linearId)         { this.linearId = linearId; }
    public void setProductName(String productName)   { this.productName = productName; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public void setOwner(String owner)               { this.owner = owner; }
    public void setStatus(String status)             { this.status = status; }
}
