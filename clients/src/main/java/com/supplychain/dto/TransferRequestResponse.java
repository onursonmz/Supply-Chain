package com.supplychain.dto;

import com.supplychain.entity.TransferRequest;
import java.time.format.DateTimeFormatter;

public class TransferRequestResponse {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private String transferRequestId;
    private String fromOrganizationId;
    private String fromOrganizationName;
    private String toOrganizationId;
    private String toOrganizationName;
    private String medicineName;
    private String batchNumber;
    private String gtin;
    private int    quantity;
    private String status;
    private String transferReferenceNo;
    private String notes;
    private String createdBy;
    private String createdAt;
    private String dispatchedAt;
    private String dispatchedBy;
    private String acceptedAt;
    private String acceptedBy;
    private String rejectedAt;
    private String rejectedBy;
    private String rejectionReason;
    private String coldChainStatus;
    private int    linearIdCount;

    public static TransferRequestResponse from(TransferRequest r) {
        TransferRequestResponse d = new TransferRequestResponse();
        d.transferRequestId  = r.getTransferRequestId();
        d.fromOrganizationId = r.getFromOrganizationId();
        d.fromOrganizationName = r.getFromOrganizationName();
        d.toOrganizationId   = r.getToOrganizationId();
        d.toOrganizationName = r.getToOrganizationName();
        d.medicineName       = r.getMedicineName();
        d.batchNumber        = r.getBatchNumber();
        d.gtin               = r.getGtin();
        d.quantity           = r.getQuantity();
        d.status             = r.getStatus();
        d.transferReferenceNo = r.getTransferReferenceNo();
        d.notes              = r.getNotes();
        d.createdBy          = r.getCreatedBy();
        d.createdAt          = r.getCreatedAt()     != null ? r.getCreatedAt().format(FMT)     : null;
        d.dispatchedAt       = r.getDispatchedAt()  != null ? r.getDispatchedAt().format(FMT)  : null;
        d.dispatchedBy       = r.getDispatchedBy();
        d.acceptedAt         = r.getAcceptedAt()    != null ? r.getAcceptedAt().format(FMT)    : null;
        d.acceptedBy         = r.getAcceptedBy();
        d.rejectedAt         = r.getRejectedAt()    != null ? r.getRejectedAt().format(FMT)    : null;
        d.rejectedBy         = r.getRejectedBy();
        d.rejectionReason    = r.getRejectionReason();
        d.coldChainStatus    = r.getColdChainStatus();
        d.linearIdCount      = r.getLinearIdList().size();
        return d;
    }

    public String getTransferRequestId()   { return transferRequestId; }
    public String getFromOrganizationId()  { return fromOrganizationId; }
    public String getFromOrganizationName(){ return fromOrganizationName; }
    public String getToOrganizationId()    { return toOrganizationId; }
    public String getToOrganizationName()  { return toOrganizationName; }
    public String getMedicineName()        { return medicineName; }
    public String getBatchNumber()         { return batchNumber; }
    public String getGtin()               { return gtin; }
    public int    getQuantity()            { return quantity; }
    public String getStatus()             { return status; }
    public String getTransferReferenceNo() { return transferReferenceNo; }
    public String getNotes()              { return notes; }
    public String getCreatedBy()          { return createdBy; }
    public String getCreatedAt()          { return createdAt; }
    public String getDispatchedAt()       { return dispatchedAt; }
    public String getDispatchedBy()       { return dispatchedBy; }
    public String getAcceptedAt()         { return acceptedAt; }
    public String getAcceptedBy()         { return acceptedBy; }
    public String getRejectedAt()         { return rejectedAt; }
    public String getRejectedBy()         { return rejectedBy; }
    public String getRejectionReason()    { return rejectionReason; }
    public String getColdChainStatus()    { return coldChainStatus; }
    public int    getLinearIdCount()      { return linearIdCount; }

    public void setTransferRequestId(String v)   { this.transferRequestId = v; }
    public void setFromOrganizationId(String v)  { this.fromOrganizationId = v; }
    public void setFromOrganizationName(String v){ this.fromOrganizationName = v; }
    public void setToOrganizationId(String v)    { this.toOrganizationId = v; }
    public void setToOrganizationName(String v)  { this.toOrganizationName = v; }
    public void setMedicineName(String v)        { this.medicineName = v; }
    public void setBatchNumber(String v)         { this.batchNumber = v; }
    public void setGtin(String v)               { this.gtin = v; }
    public void setQuantity(int v)              { this.quantity = v; }
    public void setStatus(String v)             { this.status = v; }
    public void setTransferReferenceNo(String v) { this.transferReferenceNo = v; }
    public void setNotes(String v)              { this.notes = v; }
    public void setCreatedBy(String v)          { this.createdBy = v; }
    public void setCreatedAt(String v)          { this.createdAt = v; }
    public void setDispatchedAt(String v)       { this.dispatchedAt = v; }
    public void setDispatchedBy(String v)       { this.dispatchedBy = v; }
    public void setAcceptedAt(String v)         { this.acceptedAt = v; }
    public void setAcceptedBy(String v)         { this.acceptedBy = v; }
    public void setRejectedAt(String v)         { this.rejectedAt = v; }
    public void setRejectedBy(String v)         { this.rejectedBy = v; }
    public void setRejectionReason(String v)    { this.rejectionReason = v; }
    public void setColdChainStatus(String v)    { this.coldChainStatus = v; }
    public void setLinearIdCount(int v)         { this.linearIdCount = v; }
}
