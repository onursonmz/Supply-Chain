package com.supplychain.dto;

import com.supplychain.entity.AppUser;

public class UserResponse {
    private String userId;
    private String username;
    private String fullName;
    private String role;
    private String organizationId;
    private String organizationName;
    private String status;
    private String createdAt;

    public static UserResponse from(AppUser u, String orgName) {
        UserResponse r = new UserResponse();
        r.userId           = u.getUserId();
        r.username         = u.getUsername();
        r.fullName         = u.getFullName();
        r.role             = u.getRole();
        r.organizationId   = u.getOrganizationId();
        r.organizationName = orgName;
        r.status           = u.getStatus();
        r.createdAt        = u.getCreatedAt() != null ? u.getCreatedAt().toString() : null;
        return r;
    }

    public String getUserId()           { return userId; }
    public String getUsername()         { return username; }
    public String getFullName()         { return fullName; }
    public String getRole()             { return role; }
    public String getOrganizationId()   { return organizationId; }
    public String getOrganizationName() { return organizationName; }
    public String getStatus()           { return status; }
    public String getCreatedAt()        { return createdAt; }

    public void setUserId(String v)           { userId           = v; }
    public void setUsername(String v)         { username         = v; }
    public void setFullName(String v)         { fullName         = v; }
    public void setRole(String v)             { role             = v; }
    public void setOrganizationId(String v)   { organizationId   = v; }
    public void setOrganizationName(String v) { organizationName = v; }
    public void setStatus(String v)           { status           = v; }
    public void setCreatedAt(String v)        { createdAt        = v; }
}
