package com.supplychain.dto;

import com.supplychain.entity.MedicineBatch;
import java.util.List;

public class MedicineBatchResponse {
    private String batchId;
    private String medicineName;
    private String gtin;
    private String batchNumber;
    private String manufacturerName;
    private String expiryDate;
    private String category;
    private int    quantity;
    private String organizationId;
    private String createdAt;
    private List<MedicineResponse> createdMedicines;

    public static MedicineBatchResponse from(MedicineBatch b, List<MedicineResponse> medicines) {
        MedicineBatchResponse r = new MedicineBatchResponse();
        r.batchId          = b.getBatchId();
        r.medicineName     = b.getMedicineName();
        r.gtin             = b.getGtin();
        r.batchNumber      = b.getBatchNumber();
        r.manufacturerName = b.getManufacturerName();
        r.expiryDate       = b.getExpiryDate();
        r.category         = b.getCategory();
        r.quantity         = b.getQuantity();
        r.organizationId   = b.getOrganizationId();
        r.createdAt        = b.getCreatedAt() != null ? b.getCreatedAt().toString() : null;
        r.createdMedicines = medicines;
        return r;
    }

    public String getBatchId()          { return batchId; }
    public String getMedicineName()     { return medicineName; }
    public String getGtin()             { return gtin; }
    public String getBatchNumber()      { return batchNumber; }
    public String getManufacturerName() { return manufacturerName; }
    public String getExpiryDate()       { return expiryDate; }
    public String getCategory()         { return category; }
    public int    getQuantity()         { return quantity; }
    public String getOrganizationId()   { return organizationId; }
    public String getCreatedAt()        { return createdAt; }
    public List<MedicineResponse> getCreatedMedicines() { return createdMedicines; }

    public void setBatchId(String v)          { batchId          = v; }
    public void setMedicineName(String v)     { medicineName     = v; }
    public void setGtin(String v)             { gtin             = v; }
    public void setBatchNumber(String v)      { batchNumber      = v; }
    public void setManufacturerName(String v) { manufacturerName = v; }
    public void setExpiryDate(String v)       { expiryDate       = v; }
    public void setCategory(String v)         { category         = v; }
    public void setQuantity(int v)            { quantity         = v; }
    public void setOrganizationId(String v)   { organizationId   = v; }
    public void setCreatedAt(String v)        { createdAt        = v; }
    public void setCreatedMedicines(List<MedicineResponse> v) { createdMedicines = v; }
}
