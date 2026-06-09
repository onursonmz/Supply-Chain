package com.supplychain.dto;

import com.supplychain.states.MedicineState;

public class MedicineResponse {
    private String linearId;
    private String medicineName;
    private String gtin;
    private String batchNumber;
    private String serialNumber;
    private String manufacturerName;
    private String expiryDate;
    private String category;
    private String owner;
    private String ownerOrganizationId;
    private String ownerOrganizationName;
    private String status;
    // prescriptionReference on the blockchain holds the privacy hash
    private String prescriptionReference;
    private String prescriptionHash;
    // Extended fields (v3.1)
    private String description;
    private String strength;
    private String medicineForm;
    private String storageCondition;

    public MedicineResponse() {}

    public static MedicineResponse from(MedicineState s) {
        MedicineResponse r = new MedicineResponse();
        r.linearId              = s.getLinearId().getId().toString();
        r.medicineName          = s.getMedicineName();
        r.gtin                  = s.getGtin();
        r.batchNumber           = s.getBatchNumber();
        r.serialNumber          = s.getSerialNumber();
        r.manufacturerName      = s.getManufacturerName();
        r.expiryDate            = s.getExpiryDate();
        r.category              = s.getCategory();
        r.owner                 = s.getOwner().getName().getOrganisation();
        r.ownerOrganizationId   = s.getOwnerOrganizationId();
        r.ownerOrganizationName = s.getOwnerOrganizationName();
        r.status                = s.getStatus();
        r.prescriptionReference = s.getPrescriptionReference();
        r.prescriptionHash      = s.getPrescriptionReference(); // hash IS the stored value
        r.description           = s.getDescription();
        r.strength              = s.getStrength();
        r.medicineForm          = s.getMedicineForm();
        r.storageCondition      = s.getStorageCondition();
        return r;
    }

    public String getLinearId()              { return linearId; }
    public String getMedicineName()          { return medicineName; }
    public String getGtin()                  { return gtin; }
    public String getBatchNumber()           { return batchNumber; }
    public String getSerialNumber()          { return serialNumber; }
    public String getManufacturerName()      { return manufacturerName; }
    public String getExpiryDate()            { return expiryDate; }
    public String getCategory()              { return category; }
    public String getOwner()                 { return owner; }
    public String getOwnerOrganizationId()   { return ownerOrganizationId; }
    public String getOwnerOrganizationName() { return ownerOrganizationName; }
    public String getStatus()                { return status; }
    public String getPrescriptionReference() { return prescriptionReference; }
    public String getPrescriptionHash()      { return prescriptionHash; }
    public String getDescription()           { return description; }
    public String getStrength()              { return strength; }
    public String getMedicineForm()          { return medicineForm; }
    public String getStorageCondition()      { return storageCondition; }

    public void setLinearId(String v)              { linearId              = v; }
    public void setMedicineName(String v)          { medicineName          = v; }
    public void setGtin(String v)                  { gtin                  = v; }
    public void setBatchNumber(String v)           { batchNumber           = v; }
    public void setSerialNumber(String v)          { serialNumber          = v; }
    public void setManufacturerName(String v)      { manufacturerName      = v; }
    public void setExpiryDate(String v)            { expiryDate            = v; }
    public void setCategory(String v)              { category              = v; }
    public void setOwner(String v)                 { owner                 = v; }
    public void setOwnerOrganizationId(String v)   { ownerOrganizationId   = v; }
    public void setOwnerOrganizationName(String v) { ownerOrganizationName = v; }
    public void setStatus(String v)                { status                = v; }
    public void setPrescriptionReference(String v) { prescriptionReference = v; }
    public void setPrescriptionHash(String v)      { prescriptionHash      = v; }
    public void setDescription(String v)           { description           = v; }
    public void setStrength(String v)              { strength              = v; }
    public void setMedicineForm(String v)          { medicineForm          = v; }
    public void setStorageCondition(String v)      { storageCondition      = v; }
}
