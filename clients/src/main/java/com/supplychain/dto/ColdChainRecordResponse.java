package com.supplychain.dto;

import com.supplychain.entity.ColdChainRecord;
import java.time.format.DateTimeFormatter;

public class ColdChainRecordResponse {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private String recordId;
    private String transferRequestId;
    private String transferReferenceNo;
    private double minTemperature;
    private double maxTemperature;
    private double avgTemperature;
    private double minAllowedTemp;
    private double maxAllowedTemp;
    private String transportStartTime;
    private String transportEndTime;
    private String coldChainStatus;
    private String violationsJson;
    private String vehicleId;
    private String submittedBy;
    private String submittedAt;
    private String notes;

    public static ColdChainRecordResponse from(ColdChainRecord r) {
        ColdChainRecordResponse d = new ColdChainRecordResponse();
        d.recordId            = r.getRecordId();
        d.transferRequestId   = r.getTransferRequestId();
        d.transferReferenceNo = r.getTransferReferenceNo();
        d.minTemperature      = r.getMinTemperature();
        d.maxTemperature      = r.getMaxTemperature();
        d.avgTemperature      = r.getAvgTemperature();
        d.minAllowedTemp      = r.getMinAllowedTemp();
        d.maxAllowedTemp      = r.getMaxAllowedTemp();
        d.transportStartTime  = r.getTransportStartTime()  != null ? r.getTransportStartTime().format(FMT)  : null;
        d.transportEndTime    = r.getTransportEndTime()    != null ? r.getTransportEndTime().format(FMT)    : null;
        d.coldChainStatus     = r.getColdChainStatus();
        d.violationsJson      = r.getViolationsJson();
        d.vehicleId           = r.getVehicleId();
        d.submittedBy         = r.getSubmittedBy();
        d.submittedAt         = r.getSubmittedAt()         != null ? r.getSubmittedAt().format(FMT)         : null;
        d.notes               = r.getNotes();
        return d;
    }

    public String getRecordId()             { return recordId; }
    public String getTransferRequestId()    { return transferRequestId; }
    public String getTransferReferenceNo()  { return transferReferenceNo; }
    public double getMinTemperature()       { return minTemperature; }
    public double getMaxTemperature()       { return maxTemperature; }
    public double getAvgTemperature()       { return avgTemperature; }
    public double getMinAllowedTemp()       { return minAllowedTemp; }
    public double getMaxAllowedTemp()       { return maxAllowedTemp; }
    public String getTransportStartTime()   { return transportStartTime; }
    public String getTransportEndTime()     { return transportEndTime; }
    public String getColdChainStatus()      { return coldChainStatus; }
    public String getViolationsJson()       { return violationsJson; }
    public String getVehicleId()            { return vehicleId; }
    public String getSubmittedBy()          { return submittedBy; }
    public String getSubmittedAt()          { return submittedAt; }
    public String getNotes()                { return notes; }

    public void setRecordId(String v)           { this.recordId = v; }
    public void setTransferRequestId(String v)  { this.transferRequestId = v; }
    public void setTransferReferenceNo(String v) { this.transferReferenceNo = v; }
    public void setMinTemperature(double v)     { this.minTemperature = v; }
    public void setMaxTemperature(double v)     { this.maxTemperature = v; }
    public void setAvgTemperature(double v)     { this.avgTemperature = v; }
    public void setMinAllowedTemp(double v)     { this.minAllowedTemp = v; }
    public void setMaxAllowedTemp(double v)     { this.maxAllowedTemp = v; }
    public void setTransportStartTime(String v) { this.transportStartTime = v; }
    public void setTransportEndTime(String v)   { this.transportEndTime = v; }
    public void setColdChainStatus(String v)    { this.coldChainStatus = v; }
    public void setViolationsJson(String v)     { this.violationsJson = v; }
    public void setVehicleId(String v)          { this.vehicleId = v; }
    public void setSubmittedBy(String v)        { this.submittedBy = v; }
    public void setSubmittedAt(String v)        { this.submittedAt = v; }
    public void setNotes(String v)              { this.notes = v; }
}
