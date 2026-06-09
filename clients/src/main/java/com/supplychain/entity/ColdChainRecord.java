package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cold_chain_records")
public class ColdChainRecord {

    @Id
    @Column(name = "record_id")
    private String recordId;

    @Column(name = "transfer_request_id", nullable = false)
    private String transferRequestId;

    @Column(name = "transfer_reference_no")
    private String transferReferenceNo;

    @Column(name = "min_temperature")
    private double minTemperature;

    @Column(name = "max_temperature")
    private double maxTemperature;

    @Column(name = "avg_temperature")
    private double avgTemperature;

    @Column(name = "min_allowed_temp")
    private double minAllowedTemp;

    @Column(name = "max_allowed_temp")
    private double maxAllowedTemp;

    @Column(name = "transport_start_time")
    private LocalDateTime transportStartTime;

    @Column(name = "transport_end_time")
    private LocalDateTime transportEndTime;

    // VALID or VIOLATED
    @Column(name = "cold_chain_status")
    private String coldChainStatus;

    // JSON array of violation records: [{timestamp, temperature, note}]
    @Column(name = "violations_json", length = 10000)
    private String violationsJson;

    @Column(name = "vehicle_id")
    private String vehicleId;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "notes", length = 1000)
    private String notes;

    public String getRecordId()                       { return recordId; }
    public void   setRecordId(String v)               { this.recordId = v; }
    public String getTransferRequestId()              { return transferRequestId; }
    public void   setTransferRequestId(String v)      { this.transferRequestId = v; }
    public String getTransferReferenceNo()            { return transferReferenceNo; }
    public void   setTransferReferenceNo(String v)    { this.transferReferenceNo = v; }
    public double getMinTemperature()                 { return minTemperature; }
    public void   setMinTemperature(double v)         { this.minTemperature = v; }
    public double getMaxTemperature()                 { return maxTemperature; }
    public void   setMaxTemperature(double v)         { this.maxTemperature = v; }
    public double getAvgTemperature()                 { return avgTemperature; }
    public void   setAvgTemperature(double v)         { this.avgTemperature = v; }
    public double getMinAllowedTemp()                 { return minAllowedTemp; }
    public void   setMinAllowedTemp(double v)         { this.minAllowedTemp = v; }
    public double getMaxAllowedTemp()                 { return maxAllowedTemp; }
    public void   setMaxAllowedTemp(double v)         { this.maxAllowedTemp = v; }
    public LocalDateTime getTransportStartTime()      { return transportStartTime; }
    public void setTransportStartTime(LocalDateTime v){ this.transportStartTime = v; }
    public LocalDateTime getTransportEndTime()        { return transportEndTime; }
    public void setTransportEndTime(LocalDateTime v)  { this.transportEndTime = v; }
    public String getColdChainStatus()                { return coldChainStatus; }
    public void   setColdChainStatus(String v)        { this.coldChainStatus = v; }
    public String getViolationsJson()                 { return violationsJson; }
    public void   setViolationsJson(String v)         { this.violationsJson = v; }
    public String getVehicleId()                      { return vehicleId; }
    public void   setVehicleId(String v)              { this.vehicleId = v; }
    public String getSubmittedBy()                    { return submittedBy; }
    public void   setSubmittedBy(String v)            { this.submittedBy = v; }
    public LocalDateTime getSubmittedAt()             { return submittedAt; }
    public void   setSubmittedAt(LocalDateTime v)     { this.submittedAt = v; }
    public String getNotes()                          { return notes; }
    public void   setNotes(String v)                  { this.notes = v; }
}
