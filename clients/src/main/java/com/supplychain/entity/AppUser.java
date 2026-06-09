package com.supplychain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    private String userId;
    @Column(unique = true)
    private String username;
    private String password;           // plaintext for demo
    private String fullName;
    private String role;               // ADMIN, MANUFACTURER_USER, DISTRIBUTOR_USER, PHARMACY_USER, REGULATOR_USER
    private String organizationId;
    private String status;             // ACTIVE, PASSIVE
    private LocalDateTime createdAt;

    public AppUser() {}

    public AppUser(String userId, String username, String password,
                   String fullName, String role, String organizationId) {
        this.userId         = userId;
        this.username       = username;
        this.password       = password;
        this.fullName       = fullName;
        this.role           = role;
        this.organizationId = organizationId;
        this.status         = "ACTIVE";
        this.createdAt      = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status    == null) status    = "ACTIVE";
    }

    public String        getUserId()         { return userId; }
    public String        getUsername()       { return username; }
    public String        getPassword()       { return password; }
    public String        getFullName()       { return fullName; }
    public String        getRole()           { return role; }
    public String        getOrganizationId() { return organizationId; }
    public String        getStatus()         { return status; }
    public LocalDateTime getCreatedAt()      { return createdAt; }

    public void setUserId(String v)         { userId         = v; }
    public void setUsername(String v)       { username       = v; }
    public void setPassword(String v)       { password       = v; }
    public void setFullName(String v)       { fullName       = v; }
    public void setRole(String v)           { role           = v; }
    public void setOrganizationId(String v) { organizationId = v; }
    public void setStatus(String v)         { status         = v; }
    public void setCreatedAt(LocalDateTime v){ createdAt     = v; }
}
