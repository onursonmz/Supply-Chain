package com.supplychain.dto;

public class CreateOrganizationRequest {
    private String organizationName;
    private String organizationType;
    private String licenseNumber;
    private String city;
    private String district;
    private String address;
    private String phone;
    private String email;
    private String cordaPartyName;

    public String getOrganizationName() { return organizationName; }
    public String getOrganizationType() { return organizationType; }
    public String getLicenseNumber()    { return licenseNumber; }
    public String getCity()             { return city; }
    public String getDistrict()         { return district; }
    public String getAddress()          { return address; }
    public String getPhone()            { return phone; }
    public String getEmail()            { return email; }
    public String getCordaPartyName()   { return cordaPartyName; }

    public void setOrganizationName(String v) { organizationName = v; }
    public void setOrganizationType(String v) { organizationType = v; }
    public void setLicenseNumber(String v)    { licenseNumber    = v; }
    public void setCity(String v)             { city             = v; }
    public void setDistrict(String v)         { district         = v; }
    public void setAddress(String v)          { address          = v; }
    public void setPhone(String v)            { phone            = v; }
    public void setEmail(String v)            { email            = v; }
    public void setCordaPartyName(String v)   { cordaPartyName   = v; }
}
