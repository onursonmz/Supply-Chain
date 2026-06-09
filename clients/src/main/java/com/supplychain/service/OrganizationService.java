package com.supplychain.service;

import com.supplychain.dto.CreateOrganizationRequest;
import com.supplychain.dto.OrganizationResponse;
import com.supplychain.entity.Organization;
import com.supplychain.repository.OrganizationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationService {

    private final OrganizationRepository repo;

    public OrganizationService(OrganizationRepository repo) { this.repo = repo; }

    public List<OrganizationResponse> getAll() {
        return repo.findAll().stream().map(OrganizationResponse::from).collect(Collectors.toList());
    }

    public List<OrganizationResponse> getByType(String type) {
        return repo.findByOrganizationType(type).stream().map(OrganizationResponse::from).collect(Collectors.toList());
    }

    public List<OrganizationResponse> getActiveByType(String type) {
        return repo.findByOrganizationTypeAndStatus(type, "ACTIVE")
                .stream().map(OrganizationResponse::from).collect(Collectors.toList());
    }

    public List<OrganizationResponse> getAllActive() {
        return repo.findByStatus("ACTIVE").stream().map(OrganizationResponse::from).collect(Collectors.toList());
    }

    public OrganizationResponse getById(String id) {
        return repo.findById(id).map(OrganizationResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found: " + id));
    }

    public Organization findEntityById(String id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Organization not found: " + id));
    }

    public OrganizationResponse create(CreateOrganizationRequest req) {
        Organization org = new Organization();
        org.setOrganizationId("ORG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        org.setOrganizationName(req.getOrganizationName());
        org.setOrganizationType(req.getOrganizationType());
        org.setLicenseNumber(req.getLicenseNumber());
        org.setCity(req.getCity());
        org.setDistrict(req.getDistrict());
        org.setAddress(req.getAddress());
        org.setPhone(req.getPhone());
        org.setEmail(req.getEmail());
        org.setCordaPartyName(req.getCordaPartyName());
        org.setStatus("ACTIVE");
        return OrganizationResponse.from(repo.save(org));
    }

    public OrganizationResponse update(String id, CreateOrganizationRequest req) {
        Organization org = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found: " + id));
        if (req.getOrganizationName() != null) org.setOrganizationName(req.getOrganizationName());
        if (req.getOrganizationType() != null) org.setOrganizationType(req.getOrganizationType());
        if (req.getLicenseNumber()    != null) org.setLicenseNumber(req.getLicenseNumber());
        if (req.getCity()             != null) org.setCity(req.getCity());
        if (req.getDistrict()         != null) org.setDistrict(req.getDistrict());
        if (req.getAddress()          != null) org.setAddress(req.getAddress());
        if (req.getPhone()            != null) org.setPhone(req.getPhone());
        if (req.getEmail()            != null) org.setEmail(req.getEmail());
        if (req.getCordaPartyName()   != null) org.setCordaPartyName(req.getCordaPartyName());
        return OrganizationResponse.from(repo.save(org));
    }

    public void toggleStatus(String id) {
        Organization org = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found: " + id));
        org.setStatus("ACTIVE".equals(org.getStatus()) ? "PASSIVE" : "ACTIVE");
        repo.save(org);
    }

    public long countByType(String type) { return repo.findByOrganizationType(type).size(); }
    public long countAll()               { return repo.count(); }
}
