package com.supplychain.controller;

import com.supplychain.dto.ColdChainRecordResponse;
import com.supplychain.dto.TransferEventResponse;
import com.supplychain.dto.TransferRequestResponse;
import com.supplychain.entity.MedicineBatch;
import com.supplychain.service.ColdChainService;
import com.supplychain.service.MedicineService;
import com.supplychain.service.OrganizationService;
import com.supplychain.service.TransferRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final MedicineService        medicineService;
    private final TransferRequestService transferRequestService;
    private final ColdChainService       coldChainService;
    private final OrganizationService    orgService;

    public AuditController(MedicineService medicineService,
                            TransferRequestService transferRequestService,
                            ColdChainService coldChainService,
                            OrganizationService orgService) {
        this.medicineService        = medicineService;
        this.transferRequestService = transferRequestService;
        this.coldChainService       = coldChainService;
        this.orgService             = orgService;
    }

    @GetMapping("/medicines")
    public ResponseEntity<?> allMedicines(HttpSession session) {
        if (session.getAttribute("username") == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try { return ResponseEntity.ok(medicineService.getAllMedicinesIncludingConsumed()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/medicines/{linearId}")
    public ResponseEntity<?> medicineHistory(@PathVariable String linearId, HttpSession session) {
        if (session.getAttribute("username") == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try { return ResponseEntity.ok(medicineService.getMedicineHistory(linearId)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    /**
     * Audit report with optional filters:
     * from, to (ISO date), medicine, status
     */
    @GetMapping("/report")
    public ResponseEntity<?> report(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String medicine,
            @RequestParam(required = false) String status,
            HttpSession session) {

        if (session.getAttribute("username") == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            List<TransferRequestResponse> transfers = transferRequestService.getAllRequests();

            if (medicine != null && !medicine.isBlank()) {
                String q = medicine.toLowerCase();
                transfers = transfers.stream()
                        .filter(t -> t.getMedicineName() != null && t.getMedicineName().toLowerCase().contains(q))
                        .collect(Collectors.toList());
            }
            if (status != null && !status.isBlank()) {
                transfers = transfers.stream()
                        .filter(t -> status.equals(t.getStatus()))
                        .collect(Collectors.toList());
            }

            List<TransferEventResponse> events = medicineService.getAllTransferEvents();
            List<ColdChainRecordResponse> violations = coldChainService.getAllViolations();

            Map<String, Object> report = new LinkedHashMap<>();
            report.put("generatedAt", java.time.LocalDateTime.now().toString());
            report.put("filters", Map.of(
                    "from",     from     != null ? from     : "",
                    "to",       to       != null ? to       : "",
                    "medicine", medicine != null ? medicine : "",
                    "status",   status   != null ? status   : ""
            ));
            report.put("transferCount",   transfers.size());
            report.put("transfers",       transfers);
            report.put("coldChainViolationCount", violations.size());
            report.put("coldChainViolations",     violations);
            report.put("eventCount", events.size());

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Expiring medicines ────────────────────────────────────────────────────

    @GetMapping("/expiring")
    public ResponseEntity<?> getExpiringMedicines(
            @RequestParam(defaultValue = "90") int days,
            HttpSession session) {
        if (!isAuth(session)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            LocalDate today    = LocalDate.now();
            LocalDate deadline = today.plusDays(days);

            List<Map<String, Object>> result = medicineService.getAllBatches().stream()
                    .filter(b -> b.getQuantity() > 0 && b.getExpiryDate() != null && !b.getExpiryDate().isBlank())
                    .filter(b -> {
                        try {
                            LocalDate exp = LocalDate.parse(b.getExpiryDate());
                            return !exp.isBefore(today) && !exp.isAfter(deadline);
                        } catch (Exception e) { return false; }
                    })
                    .map(b -> {
                        LocalDate exp  = LocalDate.parse(b.getExpiryDate());
                        long daysLeft  = ChronoUnit.DAYS.between(today, exp);
                        String risk    = daysLeft <= 30 ? "CRITICAL" : daysLeft <= 60 ? "WARNING" : "WATCH";
                        String orgName = "";
                        try { orgName = orgService.findEntityById(b.getOrganizationId()).getOrganizationName(); } catch (Exception ignored) {}
                        String orgType = "";
                        try { orgType = orgService.findEntityById(b.getOrganizationId()).getOrganizationType(); } catch (Exception ignored) {}
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("batchId",       b.getBatchId());
                        row.put("medicineName",  b.getMedicineName());
                        row.put("batchNumber",   b.getBatchNumber());
                        row.put("ownerName",     orgName);
                        row.put("ownerRole",     orgType);
                        row.put("quantity",      b.getQuantity());
                        row.put("expiryDate",    b.getExpiryDate());
                        row.put("daysLeft",      daysLeft);
                        row.put("riskLevel",     risk);
                        return row;
                    })
                    .sorted(Comparator.comparingLong(m -> (long) m.get("daysLeft")))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Critical stock ────────────────────────────────────────────────────────

    @GetMapping("/critical-stock")
    public ResponseEntity<?> getCriticalStock(
            @RequestParam(defaultValue = "20") int threshold,
            HttpSession session) {
        if (!isAuth(session)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            List<Map<String, Object>> result = medicineService.getAllBatches().stream()
                    .filter(b -> b.getQuantity() > 0 && b.getQuantity() < threshold)
                    .map(b -> {
                        String orgName = "";
                        try { orgName = orgService.findEntityById(b.getOrganizationId()).getOrganizationName(); } catch (Exception ignored) {}
                        String orgType = "";
                        try { orgType = orgService.findEntityById(b.getOrganizationId()).getOrganizationType(); } catch (Exception ignored) {}
                        String status  = b.getQuantity() <= 5 ? "CRITICAL" : b.getQuantity() <= 10 ? "LOW" : "WATCH";
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("batchId",          b.getBatchId());
                        row.put("medicineName",     b.getMedicineName());
                        row.put("batchNumber",      b.getBatchNumber());
                        row.put("ownerName",        orgName);
                        row.put("ownerRole",        orgType);
                        row.put("currentQuantity",  b.getQuantity());
                        row.put("minimumThreshold", threshold);
                        row.put("stockStatus",      status);
                        return row;
                    })
                    .sorted(Comparator.comparingInt(m -> (int) m.get("currentQuantity")))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Suspicious transactions ───────────────────────────────────────────────

    @GetMapping("/suspicious")
    public ResponseEntity<?> getSuspiciousTransactions(HttpSession session) {
        if (!isAuth(session)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            List<Map<String, Object>> suspicious = new ArrayList<>();
            LocalDate today = LocalDate.now();

            // Expired medicine batches still in stock
            medicineService.getAllBatches().stream()
                    .filter(b -> b.getQuantity() > 0 && b.getExpiryDate() != null && !b.getExpiryDate().isBlank())
                    .filter(b -> { try { return LocalDate.parse(b.getExpiryDate()).isBefore(today); } catch (Exception e) { return false; } })
                    .forEach(b -> {
                        String orgName = "";
                        try { orgName = orgService.findEntityById(b.getOrganizationId()).getOrganizationName(); } catch (Exception ignored) {}
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("type",        "EXPIRED_IN_STOCK");
                        row.put("description", "Son kullanma tarihi geçmiş ürün stokta: " + b.getMedicineName());
                        row.put("medicineName",b.getMedicineName());
                        row.put("batchNumber", b.getBatchNumber());
                        row.put("ownerName",   orgName);
                        row.put("quantity",    b.getQuantity());
                        row.put("expiryDate",  b.getExpiryDate());
                        row.put("severity",    "HIGH");
                        suspicious.add(row);
                    });

            // Batches with missing batch number
            medicineService.getAllBatches().stream()
                    .filter(b -> b.getBatchNumber() == null || b.getBatchNumber().isBlank())
                    .forEach(b -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("type",        "MISSING_BATCH_NUMBER");
                        row.put("description", "Parti/lot numarası eksik kayıt: " + b.getMedicineName());
                        row.put("medicineName",b.getMedicineName());
                        row.put("severity",    "MEDIUM");
                        suspicious.add(row);
                    });

            // Cancelled transfers
            long cancelledCount = transferRequestService.getAllRequests().stream()
                    .filter(t -> "CANCELLED".equals(t.getStatus())).count();
            if (cancelledCount > 0) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("type",        "CANCELLED_TRANSFERS");
                row.put("description", cancelledCount + " adet iptal edilmiş transfer mevcut");
                row.put("count",       cancelledCount);
                row.put("severity",    "LOW");
                suspicious.add(row);
            }

            return ResponseEntity.ok(suspicious);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Transfer timeline ─────────────────────────────────────────────────────

    @GetMapping("/timeline")
    public ResponseEntity<?> getTransferTimeline(
            @RequestParam(defaultValue = "20") int limit,
            HttpSession session) {
        if (!isAuth(session)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            List<Map<String, Object>> timeline = transferRequestService.getAllRequests().stream()
                    .filter(t -> "TRANSFERRED".equals(t.getStatus()))
                    .limit(limit)
                    .map(t -> {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("referenceNo",  t.getTransferReferenceNo());
                        entry.put("medicineName", t.getMedicineName());
                        entry.put("quantity",     t.getQuantity());
                        entry.put("from",         t.getFromOrganizationName());
                        entry.put("to",           t.getToOrganizationName());
                        entry.put("timestamp",    t.getDispatchedAt() != null ? t.getDispatchedAt() : t.getCreatedAt());
                        return entry;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(timeline);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isAuth(HttpSession s) { return s.getAttribute("username") != null; }
}
