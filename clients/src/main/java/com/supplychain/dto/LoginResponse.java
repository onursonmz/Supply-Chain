package com.supplychain.dto;

public class LoginResponse {
    private String username;
    private String fullName;
    private String role;
    private String nodeRole;
    private String organizationId;
    private String organizationName;
    private String organizationType;

    public LoginResponse() {}

    public LoginResponse(String username, String fullName, String role, String nodeRole,
                         String organizationId, String organizationName, String organizationType) {
        this.username         = username;
        this.fullName         = fullName;
        this.role             = role;
        this.nodeRole         = nodeRole;
        this.organizationId   = organizationId;
        this.organizationName = organizationName;
        this.organizationType = organizationType;
    }

    public String getUsername()         { return username; }
    public String getFullName()         { return fullName; }
    public String getRole()             { return role; }
    public String getNodeRole()         { return nodeRole; }
    public String getOrganizationId()   { return organizationId; }
    public String getOrganizationName() { return organizationName; }
    public String getOrganizationType() { return organizationType; }

    public void setUsername(String v)         { username         = v; }
    public void setFullName(String v)         { fullName         = v; }
    public void setRole(String v)             { role             = v; }
    public void setNodeRole(String v)         { nodeRole         = v; }
    public void setOrganizationId(String v)   { organizationId   = v; }
    public void setOrganizationName(String v) { organizationName = v; }
    public void setOrganizationType(String v) { organizationType = v; }
}
