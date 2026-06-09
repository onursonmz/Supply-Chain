package com.supplychain.service;

import com.supplychain.dto.ColdChainRecordRequest;
import com.supplychain.dto.ColdChainRecordResponse;
import com.supplychain.entity.ColdChainRecord;
import com.supplychain.entity.TransferRequest;
import com.supplychain.repository.ColdChainRecordRepository;
import com.supplychain.repository.MedicineBatchRepository;
import com.supplychain.repository.TransferRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ColdChainService {

    private static final DateTimeFormatter PARSE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    private final ColdChainRecordRepository coldChainRepo;
    private final TransferRequestRepository transferRepo;
    private final MedicineBatchRepository   batchRepo;

    public ColdChainService(ColdChainRecordRepository coldChainRepo,
                             TransferRequestRepository transferRepo,
                             MedicineBatchRepository batchRepo) {
        this.coldChainRepo = coldChainRepo;
        this.transferRepo  = transferRepo;
        this.batchRepo     = batchRepo;
    }

    public ColdChainRecordResponse submitColdChain(String transferRequestId,
                                                    ColdChainRecordRequest req,
                                                    String submittedBy) {
        TransferRequest tr = transferRepo.findById(transferRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer bulunamadı: " + transferRequestId));

        boolean violated = req.getMaxTemperature() > req.getMaxAllowedTemp()
                        || req.getMinTemperature() < req.getMinAllowedTemp();

        ColdChainRecord rec = new ColdChainRecord();
        rec.setRecordId(UUID.randomUUID().toString());
        rec.setTransferRequestId(transferRequestId);
        rec.setTransferReferenceNo(tr.getTransferReferenceNo());
        rec.setMinTemperature(req.getMinTemperature());
        rec.setMaxTemperature(req.getMaxTemperature());
        rec.setAvgTemperature(req.getAvgTemperature());
        rec.setMinAllowedTemp(req.getMinAllowedTemp());
        rec.setMaxAllowedTemp(req.getMaxAllowedTemp());
        rec.setColdChainStatus(violated ? "VIOLATED" : "VALID");
        rec.setVehicleId(req.getVehicleId());
        rec.setNotes(req.getNotes());
        rec.setSubmittedBy(submittedBy);
        rec.setSubmittedAt(LocalDateTime.now());

        if (req.getTransportStartTime() != null && !req.getTransportStartTime().isBlank()) {
            try { rec.setTransportStartTime(LocalDateTime.parse(req.getTransportStartTime(), PARSE_FMT)); } catch (Exception ignored) {}
        }
        if (req.getTransportEndTime() != null && !req.getTransportEndTime().isBlank()) {
            try { rec.setTransportEndTime(LocalDateTime.parse(req.getTransportEndTime(), PARSE_FMT)); } catch (Exception ignored) {}
        }

        if (violated) {
            String violation = String.format(
                "[{\"timestamp\":\"%s\",\"temperature\":%.1f,\"note\":\"Max %.1f°C aşıldı veya Min %.1f°C altına düşüldü\"}]",
                LocalDateTime.now(), req.getMaxTemperature(), req.getMaxAllowedTemp(), req.getMinAllowedTemp()
            );
            rec.setViolationsJson(violation);
        }

        tr.setColdChainStatus(violated ? "VIOLATED" : "VALID");
        transferRepo.save(tr);

        // If violated, flag the RECEIVER's batch so it appears as risky in inventory
        if (violated && tr.getToOrganizationId() != null && tr.getBatchNumber() != null) {
            batchRepo.findByOrganizationIdAndBatchNumber(tr.getToOrganizationId(), tr.getBatchNumber())
                    .ifPresent(b -> {
                        b.setColdChainViolated(true);
                        batchRepo.save(b);
                    });
        }

        return ColdChainRecordResponse.from(coldChainRepo.save(rec));
    }

    public Optional<ColdChainRecordResponse> getByTransferRequestId(String transferRequestId) {
        return coldChainRepo.findByTransferRequestId(transferRequestId)
                .map(ColdChainRecordResponse::from);
    }

    public List<ColdChainRecordResponse> getAllViolations() {
        return coldChainRepo.findByColdChainStatusOrderBySubmittedAtDesc("VIOLATED")
                .stream().map(ColdChainRecordResponse::from).collect(Collectors.toList());
    }

    public List<ColdChainRecordResponse> getAll() {
        return coldChainRepo.findAllByOrderBySubmittedAtDesc()
                .stream().map(ColdChainRecordResponse::from).collect(Collectors.toList());
    }

    public long countViolations() {
        return coldChainRepo.countByColdChainStatus("VIOLATED");
    }
}
