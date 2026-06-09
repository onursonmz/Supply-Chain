package com.supplychain.dto;

public class ColdChainRecordRequest {
    private double minTemperature;
    private double maxTemperature;
    private double avgTemperature;
    private double minAllowedTemp;
    private double maxAllowedTemp;
    private String transportStartTime;
    private String transportEndTime;
    private String vehicleId;
    private String notes;

    public double getMinTemperature()               { return minTemperature; }
    public void   setMinTemperature(double v)       { this.minTemperature = v; }
    public double getMaxTemperature()               { return maxTemperature; }
    public void   setMaxTemperature(double v)       { this.maxTemperature = v; }
    public double getAvgTemperature()               { return avgTemperature; }
    public void   setAvgTemperature(double v)       { this.avgTemperature = v; }
    public double getMinAllowedTemp()               { return minAllowedTemp; }
    public void   setMinAllowedTemp(double v)       { this.minAllowedTemp = v; }
    public double getMaxAllowedTemp()               { return maxAllowedTemp; }
    public void   setMaxAllowedTemp(double v)       { this.maxAllowedTemp = v; }
    public String getTransportStartTime()           { return transportStartTime; }
    public void   setTransportStartTime(String v)   { this.transportStartTime = v; }
    public String getTransportEndTime()             { return transportEndTime; }
    public void   setTransportEndTime(String v)     { this.transportEndTime = v; }
    public String getVehicleId()                    { return vehicleId; }
    public void   setVehicleId(String v)            { this.vehicleId = v; }
    public String getNotes()                        { return notes; }
    public void   setNotes(String v)                { this.notes = v; }
}
