package com.supplychain.dto;

public class CreateUserRequest {
    private String username;
    private String password;
    private String fullName;
    private String role;
    private String organizationId;

    public String getUsername()       { return username; }
    public String getPassword()       { return password; }
    public String getFullName()       { return fullName; }
    public String getRole()           { return role; }
    public String getOrganizationId() { return organizationId; }

    public void setUsername(String v)       { username       = v; }
    public void setPassword(String v)       { password       = v; }
    public void setFullName(String v)       { fullName       = v; }
    public void setRole(String v)           { role           = v; }
    public void setOrganizationId(String v) { organizationId = v; }
}
