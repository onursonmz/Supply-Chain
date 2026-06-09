package com.supplychain.repository;

import com.supplychain.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, String> {
    List<TransferRequest> findByFromOrganizationIdOrderByCreatedAtDesc(String orgId);
    List<TransferRequest> findByFromOrganizationIdAndStatusOrderByCreatedAtDesc(String orgId, String status);
    List<TransferRequest> findByToOrganizationIdOrderByCreatedAtDesc(String orgId);
    List<TransferRequest> findByToOrganizationIdAndStatusOrderByCreatedAtDesc(String orgId, String status);
    List<TransferRequest> findAllByOrderByCreatedAtDesc();
    long countByFromOrganizationIdAndStatus(String orgId, String status);
    long countByToOrganizationIdAndStatus(String orgId, String status);
    long countByStatus(String status);
}
