package com.supplychain.dto;

public class TransferMedicineRequest {
    private String linearId;
    private String targetOrganizationId;

    public String getLinearId()             { return linearId; }
    public String getTargetOrganizationId() { return targetOrganizationId; }

    public void setLinearId(String v)             { linearId             = v; }
    public void setTargetOrganizationId(String v) { targetOrganizationId = v; }
}
