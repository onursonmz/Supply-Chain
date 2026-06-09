package com.supplychain.dto;

public class CreateMedicineBatchRequest {
    private String medicineName;
    private String gtin;
    private String batchNumber;
    private String expiryDate;
    private String category;
    private int    quantity;
    private String description;
    private String strength;
    private String medicineForm;
    private String storageCondition;

    public String getMedicineName()      { return medicineName; }
    public String getGtin()              { return gtin; }
    public String getBatchNumber()       { return batchNumber; }
    public String getExpiryDate()        { return expiryDate; }
    public String getCategory()          { return category; }
    public int    getQuantity()          { return quantity; }
    public String getDescription()       { return description; }
    public String getStrength()          { return strength; }
    public String getMedicineForm()      { return medicineForm; }
    public String getStorageCondition()  { return storageCondition; }

    public void setMedicineName(String v)     { medicineName     = v; }
    public void setGtin(String v)             { gtin             = v; }
    public void setBatchNumber(String v)      { batchNumber      = v; }
    public void setExpiryDate(String v)       { expiryDate       = v; }
    public void setCategory(String v)         { category         = v; }
    public void setQuantity(int v)            { quantity         = v; }
    public void setDescription(String v)      { description      = v; }
    public void setStrength(String v)         { strength         = v; }
    public void setMedicineForm(String v)     { medicineForm     = v; }
    public void setStorageCondition(String v) { storageCondition = v; }
}
