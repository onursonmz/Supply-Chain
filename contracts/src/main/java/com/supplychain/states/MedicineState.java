package com.supplychain.states;

import com.supplychain.contracts.MedicineContract;
import net.corda.core.contracts.BelongsToContract;
import net.corda.core.contracts.LinearState;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.identity.AbstractParty;
import net.corda.core.identity.Party;
import org.jetbrains.annotations.NotNull;

import java.util.Collections;
import java.util.List;

@BelongsToContract(MedicineContract.class)
public class MedicineState implements LinearState {

    private final UniqueIdentifier linearId;
    private final String medicineName;
    private final String gtin;
    private final String batchNumber;
    private final String serialNumber;
    private final String manufacturerName;
    private final String expiryDate;
    private final String category;
    private final Party  owner;
    private final String ownerOrganizationId;
    private final String ownerOrganizationName;
    private final String status;
    private final String prescriptionReference;
    // Extended fields (v3.1)
    private final String description;
    private final String strength;
    private final String medicineForm;
    private final String storageCondition;

    public static final String STATUS_CREATED              = "CREATED";
    public static final String STATUS_IN_DISTRIBUTION      = "IN_DISTRIBUTION";
    public static final String STATUS_AT_PHARMACY          = "AT_PHARMACY";
    public static final String STATUS_DISPENSED_TO_PATIENT = "DISPENSED_TO_PATIENT";
    public static final String STATUS_RECALLED             = "RECALLED";
    public static final String STATUS_EXPIRED              = "EXPIRED";

    public MedicineState(
            UniqueIdentifier linearId,
            String medicineName,
            String gtin,
            String batchNumber,
            String serialNumber,
            String manufacturerName,
            String expiryDate,
            String category,
            Party  owner,
            String ownerOrganizationId,
            String ownerOrganizationName,
            String status,
            String prescriptionReference,
            String description,
            String strength,
            String medicineForm,
            String storageCondition) {
        this.linearId              = linearId;
        this.medicineName          = medicineName;
        this.gtin                  = gtin;
        this.batchNumber           = batchNumber;
        this.serialNumber          = serialNumber;
        this.manufacturerName      = manufacturerName;
        this.expiryDate            = expiryDate;
        this.category              = category;
        this.owner                 = owner;
        this.ownerOrganizationId   = ownerOrganizationId;
        this.ownerOrganizationName = ownerOrganizationName;
        this.status                = status;
        this.prescriptionReference = prescriptionReference;
        this.description           = description;
        this.strength              = strength;
        this.medicineForm          = medicineForm;
        this.storageCondition      = storageCondition;
    }

    @NotNull @Override
    public UniqueIdentifier getLinearId() { return linearId; }

    @NotNull @Override
    public List<AbstractParty> getParticipants() {
        return Collections.singletonList(owner);
    }

    public String getMedicineName()          { return medicineName; }
    public String getGtin()                  { return gtin; }
    public String getBatchNumber()           { return batchNumber; }
    public String getSerialNumber()          { return serialNumber; }
    public String getManufacturerName()      { return manufacturerName; }
    public String getExpiryDate()            { return expiryDate; }
    public String getCategory()              { return category; }
    public Party  getOwner()                 { return owner; }
    public String getOwnerOrganizationId()   { return ownerOrganizationId; }
    public String getOwnerOrganizationName() { return ownerOrganizationName; }
    public String getStatus()                { return status; }
    public String getPrescriptionReference() { return prescriptionReference; }
    public String getDescription()           { return description; }
    public String getStrength()              { return strength; }
    public String getMedicineForm()          { return medicineForm; }
    public String getStorageCondition()      { return storageCondition; }

    @Override
    public String toString() {
        return "MedicineState{linearId=" + linearId +
               ", medicineName='" + medicineName + "', serialNumber='" + serialNumber +
               "', owner=" + owner.getName().getOrganisation() +
               ", ownerOrg='" + ownerOrganizationName + "', status='" + status + "'}";
    }
}
