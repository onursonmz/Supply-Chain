package com.supplychain.repository;

import com.supplychain.entity.TransferEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransferEventRepository extends JpaRepository<TransferEvent, String> {
    List<TransferEvent> findByMedicineLinearIdOrderByTimestampAsc(String medicineLinearId);
    List<TransferEvent> findAllByOrderByTimestampDesc();
    List<TransferEvent> findBySerialNumber(String serialNumber);
    List<TransferEvent> findByBatchNumber(String batchNumber);
}
