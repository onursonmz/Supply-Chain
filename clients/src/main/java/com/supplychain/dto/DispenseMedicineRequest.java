package com.supplychain.dto;

public class DispenseMedicineRequest {
    private String linearId;
    private String prescriptionReference;
    private String prescriptionHash;

    public String getLinearId()             { return linearId; }
    public String getPrescriptionReference(){ return prescriptionReference; }
    public String getPrescriptionHash()     { return prescriptionHash; }

    public void setLinearId(String v)              { linearId             = v; }
    public void setPrescriptionReference(String v) { prescriptionReference = v; }
    public void setPrescriptionHash(String v)      { prescriptionHash     = v; }
}
