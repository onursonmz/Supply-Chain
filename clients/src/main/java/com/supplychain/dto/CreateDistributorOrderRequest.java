package com.supplychain.dto;

public class CreateDistributorOrderRequest {
    private String manufacturerOrgId;
    private String medicineName;
    private int    quantity;
    private String description;

    public String getManufacturerOrgId()            { return manufacturerOrgId; }
    public void   setManufacturerOrgId(String v)    { this.manufacturerOrgId = v; }
    public String getMedicineName()                 { return medicineName; }
    public void   setMedicineName(String v)         { this.medicineName = v; }
    public int    getQuantity()                     { return quantity; }
    public void   setQuantity(int v)                { this.quantity = v; }
    public String getDescription()                  { return description; }
    public void   setDescription(String v)          { this.description = v; }
}
