package com.supplychain.service;

import com.supplychain.dto.CreateUserRequest;
import com.supplychain.dto.UserResponse;
import com.supplychain.entity.AppUser;
import com.supplychain.entity.Organization;
import com.supplychain.repository.OrganizationRepository;
import com.supplychain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository         userRepo;
    private final OrganizationRepository orgRepo;

    public UserService(UserRepository userRepo, OrganizationRepository orgRepo) {
        this.userRepo = userRepo;
        this.orgRepo  = orgRepo;
    }

    public List<UserResponse> getAll() {
        return userRepo.findAll().stream()
                .map(u -> UserResponse.from(u, getOrgName(u.getOrganizationId())))
                .collect(Collectors.toList());
    }

    public UserResponse getById(String id) {
        AppUser u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return UserResponse.from(u, getOrgName(u.getOrganizationId()));
    }

    public UserResponse create(CreateUserRequest req) {
        AppUser user = new AppUser(
                "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                req.getUsername(), req.getPassword(), req.getFullName(),
                req.getRole(), req.getOrganizationId()
        );
        return UserResponse.from(userRepo.save(user), getOrgName(req.getOrganizationId()));
    }

    public UserResponse update(String id, CreateUserRequest req) {
        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        if (req.getFullName()       != null) user.setFullName(req.getFullName());
        if (req.getRole()           != null) user.setRole(req.getRole());
        if (req.getOrganizationId() != null) user.setOrganizationId(req.getOrganizationId());
        if (req.getPassword()       != null && !req.getPassword().isBlank()) user.setPassword(req.getPassword());
        return UserResponse.from(userRepo.save(user), getOrgName(user.getOrganizationId()));
    }

    public void toggleStatus(String id) {
        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.setStatus("ACTIVE".equals(user.getStatus()) ? "PASSIVE" : "ACTIVE");
        userRepo.save(user);
    }

    public long countAll() { return userRepo.count(); }

    private String getOrgName(String orgId) {
        if (orgId == null) return null;
        return orgRepo.findById(orgId).map(Organization::getOrganizationName).orElse(null);
    }
}
