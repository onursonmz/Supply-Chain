package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    private String organizationId;
    private String organizationName;
    private String organizationType;   // MANUFACTURER, DISTRIBUTOR, PHARMACY, REGULATOR
    private String licenseNumber;
    private String city;
    private String district;
    private String address;
    private String phone;
    private String email;
    private String cordaPartyName;     // Corda node org name, e.g. "Manufacturer"
    private String status;             // ACTIVE, PASSIVE
    private LocalDateTime createdAt;

    public Organization() {}

    public Organization(String organizationId, String organizationName, String organizationType,
                        String licenseNumber, String city, String cordaPartyName) {
        this.organizationId   = organizationId;
        this.organizationName = organizationName;
        this.organizationType = organizationType;
        this.licenseNumber    = licenseNumber;
        this.city             = city;
        this.cordaPartyName   = cordaPartyName;
        this.status           = "ACTIVE";
        this.createdAt        = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status    == null) status    = "ACTIVE";
    }

    public String        getOrganizationId()   { return organizationId; }
    public String        getOrganizationName() { return organizationName; }
    public String        getOrganizationType() { return organizationType; }
    public String        getLicenseNumber()    { return licenseNumber; }
    public String        getCity()             { return city; }
    public String        getDistrict()         { return district; }
    public String        getAddress()          { return address; }
    public String        getPhone()            { return phone; }
    public String        getEmail()            { return email; }
    public String        getCordaPartyName()   { return cordaPartyName; }
    public String        getStatus()           { return status; }
    public LocalDateTime getCreatedAt()        { return createdAt; }

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
    public void setCreatedAt(LocalDateTime v) { createdAt        = v; }
}
