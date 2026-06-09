package com.supplychain.dto;

public class BatchSummaryResponse {
    private String  batchNumber;
    private String  medicineName;
    private String  gtin;
    private String  expiryDate;
    private String  category;
    private String  strength;
    private String  storageCondition;
    private int     availableCount;
    private int     lockedCount;
    private boolean coldChainViolated;

    public String  getBatchNumber()              { return batchNumber; }
    public void    setBatchNumber(String v)      { this.batchNumber = v; }
    public String  getMedicineName()             { return medicineName; }
    public void    setMedicineName(String v)     { this.medicineName = v; }
    public String  getGtin()                     { return gtin; }
    public void    setGtin(String v)             { this.gtin = v; }
    public String  getExpiryDate()               { return expiryDate; }
    public void    setExpiryDate(String v)       { this.expiryDate = v; }
    public String  getCategory()                 { return category; }
    public void    setCategory(String v)         { this.category = v; }
    public String  getStrength()                 { return strength; }
    public void    setStrength(String v)         { this.strength = v; }
    public String  getStorageCondition()         { return storageCondition; }
    public void    setStorageCondition(String v) { this.storageCondition = v; }
    public int     getAvailableCount()           { return availableCount; }
    public void    setAvailableCount(int v)      { this.availableCount = v; }
    public int     getLockedCount()              { return lockedCount; }
    public void    setLockedCount(int v)         { this.lockedCount = v; }
    public boolean isColdChainViolated()         { return coldChainViolated; }
    public void    setColdChainViolated(boolean v){ this.coldChainViolated = v; }
}
