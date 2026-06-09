package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "distributor_orders")
public class DistributorOrder {

    @Id
    @Column(name = "order_id")
    private String orderId;

    @Column(name = "distributor_org_id")
    private String distributorOrgId;

    @Column(name = "distributor_org_name")
    private String distributorOrgName;

    @Column(name = "manufacturer_org_id")
    private String manufacturerOrgId;

    @Column(name = "manufacturer_org_name")
    private String manufacturerOrgName;

    @Column(name = "medicine_name")
    private String medicineName;

    @Column(name = "quantity")
    private int quantity;

    @Column(name = "description", length = 1000)
    private String description;

    // PENDING, APPROVED, REJECTED
    @Column(name = "status")
    private String status;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "processed_by")
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // Filled when a TransferRequest is created from this order
    @Column(name = "transfer_request_id")
    private String transferRequestId;

    public String getOrderId()                      { return orderId; }
    public void   setOrderId(String v)              { this.orderId = v; }
    public String getDistributorOrgId()             { return distributorOrgId; }
    public void   setDistributorOrgId(String v)     { this.distributorOrgId = v; }
    public String getDistributorOrgName()           { return distributorOrgName; }
    public void   setDistributorOrgName(String v)   { this.distributorOrgName = v; }
    public String getManufacturerOrgId()            { return manufacturerOrgId; }
    public void   setManufacturerOrgId(String v)    { this.manufacturerOrgId = v; }
    public String getManufacturerOrgName()          { return manufacturerOrgName; }
    public void   setManufacturerOrgName(String v)  { this.manufacturerOrgName = v; }
    public String getMedicineName()                 { return medicineName; }
    public void   setMedicineName(String v)         { this.medicineName = v; }
    public int    getQuantity()                     { return quantity; }
    public void   setQuantity(int v)                { this.quantity = v; }
    public String getDescription()                  { return description; }
    public void   setDescription(String v)          { this.description = v; }
    public String getStatus()                       { return status; }
    public void   setStatus(String v)               { this.status = v; }
    public String getCreatedBy()                    { return createdBy; }
    public void   setCreatedBy(String v)            { this.createdBy = v; }
    public LocalDateTime getCreatedAt()             { return createdAt; }
    public void   setCreatedAt(LocalDateTime v)     { this.createdAt = v; }
    public String getProcessedBy()                  { return processedBy; }
    public void   setProcessedBy(String v)          { this.processedBy = v; }
    public LocalDateTime getProcessedAt()           { return processedAt; }
    public void   setProcessedAt(LocalDateTime v)   { this.processedAt = v; }
    public String getRejectionReason()              { return rejectionReason; }
    public void   setRejectionReason(String v)      { this.rejectionReason = v; }
    public String getTransferRequestId()            { return transferRequestId; }
    public void   setTransferRequestId(String v)    { this.transferRequestId = v; }
}
