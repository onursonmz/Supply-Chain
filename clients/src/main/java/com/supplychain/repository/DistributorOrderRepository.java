package com.supplychain.repository;

import com.supplychain.entity.DistributorOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistributorOrderRepository extends JpaRepository<DistributorOrder, String> {
    List<DistributorOrder> findByDistributorOrgIdOrderByCreatedAtDesc(String orgId);
    List<DistributorOrder> findByManufacturerOrgIdOrderByCreatedAtDesc(String orgId);
    List<DistributorOrder> findByManufacturerOrgIdAndStatusOrderByCreatedAtDesc(String orgId, String status);
    long countByManufacturerOrgIdAndStatus(String orgId, String status);
    List<DistributorOrder> findAllByOrderByCreatedAtDesc();
}
