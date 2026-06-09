package com.supplychain.dto;

import com.supplychain.entity.DistributorOrder;
import java.time.format.DateTimeFormatter;

public class DistributorOrderResponse {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private String orderId;
    private String distributorOrgId;
    private String distributorOrgName;
    private String manufacturerOrgId;
    private String manufacturerOrgName;
    private String medicineName;
    private int    quantity;
    private String description;
    private String status;
    private String createdBy;
    private String createdAt;
    private String processedBy;
    private String processedAt;
    private String rejectionReason;
    private String transferRequestId;

    public static DistributorOrderResponse from(DistributorOrder o) {
        DistributorOrderResponse d = new DistributorOrderResponse();
        d.orderId              = o.getOrderId();
        d.distributorOrgId    = o.getDistributorOrgId();
        d.distributorOrgName  = o.getDistributorOrgName();
        d.manufacturerOrgId   = o.getManufacturerOrgId();
        d.manufacturerOrgName = o.getManufacturerOrgName();
        d.medicineName        = o.getMedicineName();
        d.quantity            = o.getQuantity();
        d.description         = o.getDescription();
        d.status              = o.getStatus();
        d.createdBy           = o.getCreatedBy();
        d.createdAt           = o.getCreatedAt()    != null ? o.getCreatedAt().format(FMT)    : null;
        d.processedBy         = o.getProcessedBy();
        d.processedAt         = o.getProcessedAt()  != null ? o.getProcessedAt().format(FMT)  : null;
        d.rejectionReason     = o.getRejectionReason();
        d.transferRequestId   = o.getTransferRequestId();
        return d;
    }

    public String getOrderId()             { return orderId; }
    public String getDistributorOrgId()    { return distributorOrgId; }
    public String getDistributorOrgName()  { return distributorOrgName; }
    public String getManufacturerOrgId()   { return manufacturerOrgId; }
    public String getManufacturerOrgName() { return manufacturerOrgName; }
    public String getMedicineName()        { return medicineName; }
    public int    getQuantity()            { return quantity; }
    public String getDescription()         { return description; }
    public String getStatus()              { return status; }
    public String getCreatedBy()           { return createdBy; }
    public String getCreatedAt()           { return createdAt; }
    public String getProcessedBy()         { return processedBy; }
    public String getProcessedAt()         { return processedAt; }
    public String getRejectionReason()     { return rejectionReason; }
    public String getTransferRequestId()   { return transferRequestId; }

    public void setOrderId(String v)             { this.orderId = v; }
    public void setDistributorOrgId(String v)    { this.distributorOrgId = v; }
    public void setDistributorOrgName(String v)  { this.distributorOrgName = v; }
    public void setManufacturerOrgId(String v)   { this.manufacturerOrgId = v; }
    public void setManufacturerOrgName(String v) { this.manufacturerOrgName = v; }
    public void setMedicineName(String v)        { this.medicineName = v; }
    public void setQuantity(int v)               { this.quantity = v; }
    public void setDescription(String v)         { this.description = v; }
    public void setStatus(String v)              { this.status = v; }
    public void setCreatedBy(String v)           { this.createdBy = v; }
    public void setCreatedAt(String v)           { this.createdAt = v; }
    public void setProcessedBy(String v)         { this.processedBy = v; }
    public void setProcessedAt(String v)         { this.processedAt = v; }
    public void setRejectionReason(String v)     { this.rejectionReason = v; }
    public void setTransferRequestId(String v)   { this.transferRequestId = v; }
}
