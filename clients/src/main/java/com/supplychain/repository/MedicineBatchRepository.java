package com.supplychain.repository;

import com.supplychain.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, String> {
    List<MedicineBatch> findByOrganizationId(String organizationId);
    java.util.Optional<MedicineBatch> findByOrganizationIdAndBatchNumber(String organizationId, String batchNumber);
    List<MedicineBatch> findByOrganizationIdAndQuantityGreaterThan(String organizationId, int quantity);
}
