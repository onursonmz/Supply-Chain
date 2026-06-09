package com.supplychain.repository;

import com.supplychain.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationRepository extends JpaRepository<Organization, String> {
    List<Organization> findByOrganizationType(String type);
    List<Organization> findByOrganizationTypeAndStatus(String type, String status);
    List<Organization> findByStatus(String status);
    List<Organization> findByCordaPartyName(String cordaPartyName);
}
