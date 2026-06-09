package com.supplychain.service;

import com.supplychain.dto.LoginResponse;
import com.supplychain.entity.AppUser;
import com.supplychain.entity.Organization;
import com.supplychain.repository.OrganizationRepository;
import com.supplychain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository         userRepo;
    private final OrganizationRepository orgRepo;

    @Value("${app.node.role}")
    private String nodeRole;

    public AuthService(UserRepository userRepo, OrganizationRepository orgRepo) {
        this.userRepo = userRepo;
        this.orgRepo  = orgRepo;
    }

    public LoginResponse login(String username, String password) {
        if (username == null || password == null) return null;

        AppUser user = userRepo.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null || !"ACTIVE".equals(user.getStatus())) return null;
        if (!password.equals(user.getPassword())) return null;
        if (!isAllowedOnThisNode(user)) return null;

        String orgId   = "";
        String orgName = "";
        String orgType = "";

        if (user.getOrganizationId() != null) {
            Organization org = orgRepo.findById(user.getOrganizationId()).orElse(null);
            if (org != null) {
                orgId   = org.getOrganizationId();
                orgName = org.getOrganizationName();
                orgType = org.getOrganizationType();
            }
        }

        return new LoginResponse(
                user.getUsername(), user.getFullName(), user.getRole(),
                nodeRole, orgId, orgName, orgType
        );
    }

    public LoginResponse getUserInfo(String username) {
        if (username == null) return null;
        AppUser user = userRepo.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null) return null;

        String orgId = "", orgName = "", orgType = "";
        if (user.getOrganizationId() != null) {
            Organization org = orgRepo.findById(user.getOrganizationId()).orElse(null);
            if (org != null) { orgId = org.getOrganizationId(); orgName = org.getOrganizationName(); orgType = org.getOrganizationType(); }
        }
        return new LoginResponse(user.getUsername(), user.getFullName(), user.getRole(), nodeRole, orgId, orgName, orgType);
    }

    public String getNodeRole() { return nodeRole; }

    private boolean isAllowedOnThisNode(AppUser user) {
        String role = user.getRole();
        if ("ADMIN".equals(role) || "REGULATOR_USER".equals(role)) return true;
        if (user.getOrganizationId() == null) return false;
        Organization org = orgRepo.findById(user.getOrganizationId()).orElse(null);
        if (org == null || org.getCordaPartyName() == null) return false;
        return org.getCordaPartyName().equalsIgnoreCase(nodeRole);
    }
}
