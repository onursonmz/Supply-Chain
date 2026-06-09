package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_batches")
public class MedicineBatch {

    @Id
    private String batchId;
    private String medicineName;
    private String gtin;
    private String batchNumber;
    private String manufacturerName;
    private String expiryDate;
    private String category;
    private int    quantity;
    private String organizationId;
    private String description;
    private String strength;
    private String medicineForm;
    private String storageCondition;
    private LocalDateTime createdAt;

    // Units currently dispatched but not yet accepted by the receiver.
    // availableQuantity = quantity - lockedQuantity
    @Column(name = "locked_quantity", columnDefinition = "INTEGER DEFAULT 0")
    private int lockedQuantity = 0;

    // True if any shipment for this batch had a cold chain violation.
    // Set by ColdChainService when VIOLATED status is detected.
    @Column(name = "cold_chain_violated", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean coldChainViolated = false;

    public MedicineBatch() {}

    public MedicineBatch(String batchId, String medicineName, String gtin, String batchNumber,
                          String manufacturerName, String expiryDate, String category,
                          int quantity, String organizationId,
                          String description, String strength, String medicineForm, String storageCondition) {
        this.batchId          = batchId;
        this.medicineName     = medicineName;
        this.gtin             = gtin;
        this.batchNumber      = batchNumber;
        this.manufacturerName = manufacturerName;
        this.expiryDate       = expiryDate;
        this.category         = category;
        this.quantity         = quantity;
        this.organizationId   = organizationId;
        this.description      = description;
        this.strength         = strength;
        this.medicineForm     = medicineForm;
        this.storageCondition = storageCondition;
        this.createdAt        = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public String        getBatchId()          { return batchId; }
    public String        getMedicineName()     { return medicineName; }
    public String        getGtin()             { return gtin; }
    public String        getBatchNumber()      { return batchNumber; }
    public String        getManufacturerName() { return manufacturerName; }
    public String        getExpiryDate()       { return expiryDate; }
    public String        getCategory()         { return category; }
    public int           getQuantity()         { return quantity; }
    public String        getOrganizationId()   { return organizationId; }
    public String        getDescription()      { return description; }
    public String        getStrength()         { return strength; }
    public String        getMedicineForm()     { return medicineForm; }
    public String        getStorageCondition() { return storageCondition; }
    public LocalDateTime getCreatedAt()        { return createdAt; }

    public void setBatchId(String v)          { batchId          = v; }
    public void setMedicineName(String v)     { medicineName     = v; }
    public void setGtin(String v)             { gtin             = v; }
    public void setBatchNumber(String v)      { batchNumber      = v; }
    public void setManufacturerName(String v) { manufacturerName = v; }
    public void setExpiryDate(String v)       { expiryDate       = v; }
    public void setCategory(String v)         { category         = v; }
    public void setQuantity(int v)            { quantity         = v; }
    public void setOrganizationId(String v)   { organizationId   = v; }
    public void setDescription(String v)      { description      = v; }
    public void setStrength(String v)         { strength         = v; }
    public void setMedicineForm(String v)     { medicineForm     = v; }
    public void setStorageCondition(String v) { storageCondition = v; }
    public void setCreatedAt(LocalDateTime v) { createdAt        = v; }
    public int  getLockedQuantity()               { return lockedQuantity; }
    public void setLockedQuantity(int v)          { lockedQuantity     = v; }
    public boolean isColdChainViolated()          { return coldChainViolated; }
    public void setColdChainViolated(boolean v)   { coldChainViolated  = v; }

    public int getAvailableQuantity() {
        return Math.max(0, quantity - lockedQuantity);
    }
}
