package com.supplychain.dto;

public class CreateMedicineRequest {
    private String medicineName;
    private String batchNumber;
    private String serialNumber;
    private String manufacturerName;
    private String expiryDate;
    private String category;

    public CreateMedicineRequest() {}

    public String getMedicineName()     { return medicineName; }
    public String getBatchNumber()      { return batchNumber; }
    public String getSerialNumber()     { return serialNumber; }
    public String getManufacturerName() { return manufacturerName; }
    public String getExpiryDate()       { return expiryDate; }
    public String getCategory()         { return category; }

    public void setMedicineName(String medicineName)         { this.medicineName = medicineName; }
    public void setBatchNumber(String batchNumber)           { this.batchNumber = batchNumber; }
    public void setSerialNumber(String serialNumber)         { this.serialNumber = serialNumber; }
    public void setManufacturerName(String manufacturerName) { this.manufacturerName = manufacturerName; }
    public void setExpiryDate(String expiryDate)             { this.expiryDate = expiryDate; }
    public void setCategory(String category)                 { this.category = category; }
}
