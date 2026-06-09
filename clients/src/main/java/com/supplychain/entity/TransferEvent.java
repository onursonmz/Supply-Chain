package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_events")
public class TransferEvent {

    @Id
    @Column(name = "event_id")
    private String eventId;

    @Column(name = "medicine_linear_id", nullable = false)
    private String medicineLinearId;

    @Column(name = "medicine_name")
    private String medicineName;

    @Column(name = "serial_number")
    private String serialNumber;

    @Column(name = "batch_number")
    private String batchNumber;

    @Column(name = "from_organization_id")
    private String fromOrganizationId;

    @Column(name = "from_organization_name")
    private String fromOrganizationName;

    @Column(name = "to_organization_id")
    private String toOrganizationId;

    @Column(name = "to_organization_name")
    private String toOrganizationName;

    // CREATED, TRANSFERRED_TO_DISTRIBUTOR, TRANSFERRED_TO_PHARMACY, DISPENSED_TO_PATIENT, RECALLED
    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "performed_by")
    private String performedBy;

    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "resulting_status")
    private String resultingStatus;

    @Column(name = "notes")
    private String notes;

    public String getEventId()                        { return eventId; }
    public void   setEventId(String eventId)          { this.eventId = eventId; }

    public String getMedicineLinearId()                           { return medicineLinearId; }
    public void   setMedicineLinearId(String medicineLinearId)    { this.medicineLinearId = medicineLinearId; }

    public String getMedicineName()                       { return medicineName; }
    public void   setMedicineName(String medicineName)    { this.medicineName = medicineName; }

    public String getSerialNumber()                       { return serialNumber; }
    public void   setSerialNumber(String serialNumber)    { this.serialNumber = serialNumber; }

    public String getBatchNumber()                        { return batchNumber; }
    public void   setBatchNumber(String batchNumber)      { this.batchNumber = batchNumber; }

    public String getFromOrganizationId()                             { return fromOrganizationId; }
    public void   setFromOrganizationId(String fromOrganizationId)    { this.fromOrganizationId = fromOrganizationId; }

    public String getFromOrganizationName()                               { return fromOrganizationName; }
    public void   setFromOrganizationName(String fromOrganizationName)    { this.fromOrganizationName = fromOrganizationName; }

    public String getToOrganizationId()                           { return toOrganizationId; }
    public void   setToOrganizationId(String toOrganizationId)    { this.toOrganizationId = toOrganizationId; }

    public String getToOrganizationName()                             { return toOrganizationName; }
    public void   setToOrganizationName(String toOrganizationName)    { this.toOrganizationName = toOrganizationName; }

    public String getActionType()                         { return actionType; }
    public void   setActionType(String actionType)        { this.actionType = actionType; }

    public String getPerformedBy()                        { return performedBy; }
    public void   setPerformedBy(String performedBy)      { this.performedBy = performedBy; }

    public LocalDateTime getTimestamp()                       { return timestamp; }
    public void          setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getResultingStatus()                            { return resultingStatus; }
    public void   setResultingStatus(String resultingStatus)      { this.resultingStatus = resultingStatus; }

    public String getNotes()                  { return notes; }
    public void   setNotes(String notes)      { this.notes = notes; }
}
