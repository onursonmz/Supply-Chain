package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "transfer_requests")
public class TransferRequest {

    @Id
    @Column(name = "transfer_request_id")
    private String transferRequestId;

    @Column(name = "from_organization_id")
    private String fromOrganizationId;

    @Column(name = "from_organization_name")
    private String fromOrganizationName;

    @Column(name = "to_organization_id")
    private String toOrganizationId;

    @Column(name = "to_organization_name")
    private String toOrganizationName;

    @Column(name = "to_corda_party_name")
    private String toCordaPartyName;

    @Column(name = "medicine_name")
    private String medicineName;

    @Column(name = "batch_number")
    private String batchNumber;

    @Column(name = "gtin")
    private String gtin;

    @Column(name = "quantity")
    private int quantity;

    // Comma-separated list of linearIds to transfer
    @Column(name = "linear_ids_csv", length = 20000)
    private String linearIdsCsv;

    // PENDING, DISPATCHED, CANCELLED
    @Column(name = "status")
    private String status;

    @Column(name = "transfer_reference_no")
    private String transferReferenceNo;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "dispatched_by")
    private String dispatchedBy;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "accepted_by")
    private String acceptedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejected_by")
    private String rejectedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // Cold chain status snapshot: VALID, VIOLATED, NOT_APPLICABLE
    @Column(name = "cold_chain_status")
    private String coldChainStatus;

    public List<String> getLinearIdList() {
        if (linearIdsCsv == null || linearIdsCsv.trim().isEmpty()) return Collections.emptyList();
        return Arrays.asList(linearIdsCsv.trim().split(","));
    }

    public String getTransferRequestId() { return transferRequestId; }
    public void setTransferRequestId(String v) { this.transferRequestId = v; }
    public String getFromOrganizationId() { return fromOrganizationId; }
    public void setFromOrganizationId(String v) { this.fromOrganizationId = v; }
    public String getFromOrganizationName() { return fromOrganizationName; }
    public void setFromOrganizationName(String v) { this.fromOrganizationName = v; }
    public String getToOrganizationId() { return toOrganizationId; }
    public void setToOrganizationId(String v) { this.toOrganizationId = v; }
    public String getToOrganizationName() { return toOrganizationName; }
    public void setToOrganizationName(String v) { this.toOrganizationName = v; }
    public String getToCordaPartyName() { return toCordaPartyName; }
    public void setToCordaPartyName(String v) { this.toCordaPartyName = v; }
    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String v) { this.medicineName = v; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String v) { this.batchNumber = v; }
    public String getGtin() { return gtin; }
    public void setGtin(String v) { this.gtin = v; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int v) { this.quantity = v; }
    public String getLinearIdsCsv() { return linearIdsCsv; }
    public void setLinearIdsCsv(String v) { this.linearIdsCsv = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public String getTransferReferenceNo() { return transferReferenceNo; }
    public void setTransferReferenceNo(String v) { this.transferReferenceNo = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String v) { this.createdBy = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime v) { this.dispatchedAt = v; }
    public String getDispatchedBy() { return dispatchedBy; }
    public void setDispatchedBy(String v) { this.dispatchedBy = v; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime v) { this.acceptedAt = v; }
    public String getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(String v) { this.acceptedBy = v; }
    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime v) { this.rejectedAt = v; }
    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String v) { this.rejectedBy = v; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String v) { this.rejectionReason = v; }
    public String getColdChainStatus() { return coldChainStatus; }
    public void setColdChainStatus(String v) { this.coldChainStatus = v; }
}
