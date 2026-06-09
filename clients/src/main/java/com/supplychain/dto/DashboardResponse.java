package com.supplychain.dto;

import java.util.List;

public class DashboardResponse {
    private String nodeName;
    private String role;
    private String organizationName;
    private String organizationType;

    // Medicine stats
    private int totalMedicines;
    private int totalTransfers;
    private int createdCount;
    private int inDistributionCount;
    private int atPharmacyCount;
    private int dispensedCount;
    private int recalledCount;
    private int nearExpiryCount;
    private int myOrganizationCount;

    // Admin stats
    private int totalOrganizations;
    private int totalUsers;
    private int totalManufacturers;
    private int totalDistributors;
    private int totalPharmacies;

    private int pendingTransferCount;
    private int pendingAcceptanceCount;
    private int acceptedTransferCount;
    private int rejectedTransferCount;
    private int coldChainViolationCount;
    private int pendingOrderCount;
    private int transferredCount;
    private int todayTransferCount;
    private int criticalStockCount;
    private int incomingTransferCount;
    private int outgoingTransferCount;
    private List<MedicineResponse> recentMedicines;

    public DashboardResponse() {}

    public String getNodeName()           { return nodeName; }
    public String getRole()               { return role; }
    public String getOrganizationName()   { return organizationName; }
    public String getOrganizationType()   { return organizationType; }
    public int getTotalMedicines()        { return totalMedicines; }
    public int getTotalTransfers()        { return totalTransfers; }
    public int getCreatedCount()          { return createdCount; }
    public int getInDistributionCount()   { return inDistributionCount; }
    public int getAtPharmacyCount()       { return atPharmacyCount; }
    public int getDispensedCount()        { return dispensedCount; }
    public int getRecalledCount()         { return recalledCount; }
    public int getNearExpiryCount()       { return nearExpiryCount; }
    public int getMyOrganizationCount()   { return myOrganizationCount; }
    public int getTotalOrganizations()    { return totalOrganizations; }
    public int getTotalUsers()            { return totalUsers; }
    public int getTotalManufacturers()    { return totalManufacturers; }
    public int getTotalDistributors()     { return totalDistributors; }
    public int getTotalPharmacies()       { return totalPharmacies; }
    public int getPendingTransferCount()         { return pendingTransferCount; }
    public int getPendingAcceptanceCount()       { return pendingAcceptanceCount; }
    public int getAcceptedTransferCount()        { return acceptedTransferCount; }
    public int getRejectedTransferCount()        { return rejectedTransferCount; }
    public int getColdChainViolationCount()      { return coldChainViolationCount; }
    public int getPendingOrderCount()            { return pendingOrderCount; }
    public int getTransferredCount()             { return transferredCount; }
    public int getTodayTransferCount()           { return todayTransferCount; }
    public int getCriticalStockCount()           { return criticalStockCount; }
    public int getIncomingTransferCount()        { return incomingTransferCount; }
    public int getOutgoingTransferCount()        { return outgoingTransferCount; }
    public List<MedicineResponse> getRecentMedicines() { return recentMedicines; }

    public void setNodeName(String v)           { nodeName           = v; }
    public void setRole(String v)               { role               = v; }
    public void setOrganizationName(String v)   { organizationName   = v; }
    public void setOrganizationType(String v)   { organizationType   = v; }
    public void setTotalMedicines(int v)        { totalMedicines        = v; }
    public void setTotalTransfers(int v)        { totalTransfers        = v; }
    public void setCreatedCount(int v)          { createdCount          = v; }
    public void setInDistributionCount(int v)   { inDistributionCount   = v; }
    public void setAtPharmacyCount(int v)       { atPharmacyCount       = v; }
    public void setDispensedCount(int v)        { dispensedCount        = v; }
    public void setRecalledCount(int v)         { recalledCount         = v; }
    public void setNearExpiryCount(int v)       { nearExpiryCount       = v; }
    public void setMyOrganizationCount(int v)   { myOrganizationCount   = v; }
    public void setTotalOrganizations(int v)    { totalOrganizations    = v; }
    public void setTotalUsers(int v)            { totalUsers            = v; }
    public void setTotalManufacturers(int v)    { totalManufacturers    = v; }
    public void setTotalDistributors(int v)     { totalDistributors     = v; }
    public void setTotalPharmacies(int v)        { totalPharmacies       = v; }
    public void setPendingTransferCount(int v)      { pendingTransferCount     = v; }
    public void setPendingAcceptanceCount(int v)    { pendingAcceptanceCount   = v; }
    public void setAcceptedTransferCount(int v)     { acceptedTransferCount    = v; }
    public void setRejectedTransferCount(int v)     { rejectedTransferCount    = v; }
    public void setColdChainViolationCount(int v)   { coldChainViolationCount  = v; }
    public void setPendingOrderCount(int v)         { pendingOrderCount   = v; }
    public void setTransferredCount(int v)          { transferredCount    = v; }
    public void setTodayTransferCount(int v)        { todayTransferCount  = v; }
    public void setCriticalStockCount(int v)        { criticalStockCount    = v; }
    public void setIncomingTransferCount(int v)     { incomingTransferCount = v; }
    public void setOutgoingTransferCount(int v)     { outgoingTransferCount = v; }
    public void setRecentMedicines(List<MedicineResponse> v) { recentMedicines = v; }
}
