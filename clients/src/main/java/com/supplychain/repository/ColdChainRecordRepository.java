package com.supplychain.repository;

import com.supplychain.entity.ColdChainRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ColdChainRecordRepository extends JpaRepository<ColdChainRecord, String> {
    Optional<ColdChainRecord> findByTransferRequestId(String transferRequestId);
    List<ColdChainRecord> findByColdChainStatusOrderBySubmittedAtDesc(String status);
    List<ColdChainRecord> findAllByOrderBySubmittedAtDesc();
    long countByColdChainStatus(String status);
}
