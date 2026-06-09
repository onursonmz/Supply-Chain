package com.supplychain.dto;

import com.supplychain.entity.Organization;

public class OrganizationResponse {
    private String organizationId;
    private String organizationName;
    private String organizationType;
    private String licenseNumber;
    private String city;
    private String district;
    private String address;
    private String phone;
    private String email;
    private String cordaPartyName;
    private String status;
    private String createdAt;

    public static OrganizationResponse from(Organization o) {
        OrganizationResponse r = new OrganizationResponse();
        r.organizationId   = o.getOrganizationId();
        r.organizationName = o.getOrganizationName();
        r.organizationType = o.getOrganizationType();
        r.licenseNumber    = o.getLicenseNumber();
        r.city             = o.getCity();
        r.district         = o.getDistrict();
        r.address          = o.getAddress();
        r.phone            = o.getPhone();
        r.email            = o.getEmail();
        r.cordaPartyName   = o.getCordaPartyName();
        r.status           = o.getStatus();
        r.createdAt        = o.getCreatedAt() != null ? o.getCreatedAt().toString() : null;
        return r;
    }

    public String getOrganizationId()   { return organizationId; }
    public String getOrganizationName() { return organizationName; }
    public String getOrganizationType() { return organizationType; }
    public String getLicenseNumber()    { return licenseNumber; }
    public String getCity()             { return city; }
    public String getDistrict()         { return district; }
    public String getAddress()          { return address; }
    public String getPhone()            { return phone; }
    public String getEmail()            { return email; }
    public String getCordaPartyName()   { return cordaPartyName; }
    public String getStatus()           { return status; }
    public String getCreatedAt()        { return createdAt; }

    public void setOrganizationId(String v)   { organizationId   = v; }
    public void setOrganizationName(String v) { organizationName = v; }
    public void setOrganizationType(String v) { organizationType = v; }
    public void setLicenseNumber(String v)    { licenseNumber    = v; }
    public void setCity(String v)             { city             = v; }
    public void setDistrict(String v)         { district         = v; }
    public void setAddress(String v)          { address          = v; }
    public void setPhone(String v)            { phone            = v; }
    public void setEmail(String v)            { email            = v; }
    public void setCordaPartyName(String v)   { cordaPartyName   = v; }
    public void setStatus(String v)           { status           = v; }
    public void setCreatedAt(String v)        { createdAt        = v; }
}
