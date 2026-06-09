package com.supplychain.dto;

import com.supplychain.entity.TransferEvent;
import java.time.format.DateTimeFormatter;

public class TransferEventResponse {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private String eventId;
    private String medicineLinearId;
    private String medicineName;
    private String serialNumber;
    private String batchNumber;
    private String fromOrganizationId;
    private String fromOrganizationName;
    private String toOrganizationId;
    private String toOrganizationName;
    private String actionType;
    private String performedBy;
    private String timestamp;
    private String resultingStatus;
    private String notes;

    public TransferEventResponse() {}

    public static TransferEventResponse from(TransferEvent e) {
        TransferEventResponse r = new TransferEventResponse();
        r.eventId              = e.getEventId();
        r.medicineLinearId     = e.getMedicineLinearId();
        r.medicineName         = e.getMedicineName();
        r.serialNumber         = e.getSerialNumber();
        r.batchNumber          = e.getBatchNumber();
        r.fromOrganizationId   = e.getFromOrganizationId();
        r.fromOrganizationName = e.getFromOrganizationName();
        r.toOrganizationId     = e.getToOrganizationId();
        r.toOrganizationName   = e.getToOrganizationName();
        r.actionType           = e.getActionType();
        r.performedBy          = e.getPerformedBy();
        r.timestamp            = e.getTimestamp() != null ? e.getTimestamp().format(FORMATTER) : null;
        r.resultingStatus      = e.getResultingStatus();
        r.notes                = e.getNotes();
        return r;
    }

    public String getEventId()              { return eventId; }
    public void   setEventId(String v)      { this.eventId = v; }

    public String getMedicineLinearId()             { return medicineLinearId; }
    public void   setMedicineLinearId(String v)     { this.medicineLinearId = v; }

    public String getMedicineName()             { return medicineName; }
    public void   setMedicineName(String v)     { this.medicineName = v; }

    public String getSerialNumber()             { return serialNumber; }
    public void   setSerialNumber(String v)     { this.serialNumber = v; }

    public String getBatchNumber()              { return batchNumber; }
    public void   setBatchNumber(String v)      { this.batchNumber = v; }

    public String getFromOrganizationId()           { return fromOrganizationId; }
    public void   setFromOrganizationId(String v)   { this.fromOrganizationId = v; }

    public String getFromOrganizationName()             { return fromOrganizationName; }
    public void   setFromOrganizationName(String v)     { this.fromOrganizationName = v; }

    public String getToOrganizationId()             { return toOrganizationId; }
    public void   setToOrganizationId(String v)     { this.toOrganizationId = v; }

    public String getToOrganizationName()           { return toOrganizationName; }
    public void   setToOrganizationName(String v)   { this.toOrganizationName = v; }

    public String getActionType()           { return actionType; }
    public void   setActionType(String v)   { this.actionType = v; }

    public String getPerformedBy()          { return performedBy; }
    public void   setPerformedBy(String v)  { this.performedBy = v; }

    public String getTimestamp()            { return timestamp; }
    public void   setTimestamp(String v)    { this.timestamp = v; }

    public String getResultingStatus()          { return resultingStatus; }
    public void   setResultingStatus(String v)  { this.resultingStatus = v; }

    public String getNotes()            { return notes; }
    public void   setNotes(String v)    { this.notes = v; }
}
