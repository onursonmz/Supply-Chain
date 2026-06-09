package com.supplychain.dto;

public class CreateTransferRequestDto {
    private String batchNumber;
    private String medicineName;
    private String gtin;
    private int    quantity;
    private String targetOrganizationId;
    private String notes;

    public String getBatchNumber()         { return batchNumber; }
    public void   setBatchNumber(String v) { this.batchNumber = v; }

    public String getMedicineName()         { return medicineName; }
    public void   setMedicineName(String v) { this.medicineName = v; }

    public String getGtin()         { return gtin; }
    public void   setGtin(String v) { this.gtin = v; }

    public int  getQuantity()      { return quantity; }
    public void setQuantity(int v) { this.quantity = v; }

    public String getTargetOrganizationId()         { return targetOrganizationId; }
    public void   setTargetOrganizationId(String v) { this.targetOrganizationId = v; }

    public String getNotes()         { return notes; }
    public void   setNotes(String v) { this.notes = v; }
}
