package com.supplychain.controller;

import com.supplychain.dto.*;
import com.supplychain.entity.MedicineBatch;
import com.supplychain.entity.Organization;
import com.supplychain.service.MedicineService;
import com.supplychain.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class MedicineController {

    private final MedicineService     medicineService;
    private final OrganizationService orgService;

    public MedicineController(MedicineService medicineService, OrganizationService orgService) {
        this.medicineService = medicineService;
        this.orgService      = orgService;
    }

    // ── Batch create ──────────────────────────────────────────────────────────

    @PostMapping("/medicines/batches")
    public ResponseEntity<?> createBatch(@RequestBody CreateMedicineBatchRequest req, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        if (isBlank(req.getMedicineName())) return badRequest("medicineName required");
        if (isBlank(req.getBatchNumber()))  return badRequest("batchNumber required");
        if (isBlank(req.getGtin()))         return badRequest("gtin required");
        if (req.getQuantity() < 1 || req.getQuantity() > 100) return badRequest("quantity must be 1–100");

        String orgId   = (String) session.getAttribute("organizationId");
        String orgName = "";
        try {
            if (orgId != null) orgName = orgService.findEntityById(orgId).getOrganizationName();
        } catch (Exception ignored) {}

        // manufacturerName always comes from the logged-in user's organization
        String manufacturerName = orgName;

        try {
            MedicineBatch batch = new MedicineBatch(
                    "BAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                    req.getMedicineName(),
                    req.getGtin(),
                    req.getBatchNumber(),
                    manufacturerName,
                    req.getExpiryDate()       != null ? req.getExpiryDate()       : "",
                    req.getCategory()         != null ? req.getCategory()         : "",
                    req.getQuantity(),
                    orgId,
                    req.getDescription()      != null ? req.getDescription()      : "",
                    req.getStrength()         != null ? req.getStrength()         : "",
                    req.getMedicineForm()     != null ? req.getMedicineForm()     : "",
                    req.getStorageCondition() != null ? req.getStorageCondition() : ""
            );
            medicineService.saveBatch(batch);
            List<MedicineResponse> created = medicineService.createBatch(batch, orgId, orgName);
            return ResponseEntity.ok(MedicineBatchResponse.from(batch, created));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Transfer ──────────────────────────────────────────────────────────────

    @PostMapping("/transfers")
    public ResponseEntity<?> transfer(@RequestBody TransferMedicineRequest req, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        if (isBlank(req.getLinearId()))             return badRequest("linearId required");
        if (isBlank(req.getTargetOrganizationId())) return badRequest("targetOrganizationId required");

        String role        = (String) session.getAttribute("role");
        String performedBy = (String) session.getAttribute("username");
        try {
            Organization targetOrg = orgService.findEntityById(req.getTargetOrganizationId());
            if ("MANUFACTURER_USER".equals(role) && !"DISTRIBUTOR".equals(targetOrg.getOrganizationType()))
                return badRequest("Manufacturer can only transfer to Distributor.");
            if ("DISTRIBUTOR_USER".equals(role) && !"PHARMACY".equals(targetOrg.getOrganizationType()))
                return badRequest("Distributor can only transfer to Pharmacy.");

            MedicineResponse result = medicineService.transferMedicine(
                    req.getLinearId(), targetOrg.getCordaPartyName(),
                    targetOrg.getOrganizationId(), targetOrg.getOrganizationName(),
                    performedBy
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Dispense ──────────────────────────────────────────────────────────────

    @PostMapping("/medicines/dispense")
    public ResponseEntity<?> dispense(@RequestBody DispenseMedicineRequest req, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        if (isBlank(req.getLinearId()))              return badRequest("linearId required");
        if (isBlank(req.getPrescriptionReference())) return badRequest("prescriptionReference required");
        String performedBy = (String) session.getAttribute("username");
        try {
            return ResponseEntity.ok(medicineService.dispenseMedicine(
                    req.getLinearId(), req.getPrescriptionReference(), performedBy));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Recall (admin / regulator) ────────────────────────────────────────────

    @PostMapping("/medicines/{linearId}/recall")
    public ResponseEntity<?> recallOne(@PathVariable String linearId, HttpSession session) {
        if (!canRecall(session)) return ResponseEntity.status(403).body(Map.of("error", "Admin or Regulator access required."));
        String performedBy = (String) session.getAttribute("username");
        try {
            return ResponseEntity.ok(medicineService.recallMedicine(linearId, performedBy));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/medicines/recall-batch")
    public ResponseEntity<?> recallBatch(@RequestBody Map<String, String> body, HttpSession session) {
        if (!canRecall(session)) return ResponseEntity.status(403).body(Map.of("error", "Admin or Regulator access required."));
        String batchNumber = body.get("batchNumber");
        if (isBlank(batchNumber)) return badRequest("batchNumber required");
        try {
            // 1. Try Corda vault recall (may partially fail if some units don't exist)
            int cordaRecalled = 0;
            try {
                List<MedicineResponse> recalled = medicineService.recallBatch(batchNumber);
                cordaRecalled = recalled.size();
            } catch (Exception cordaEx) {
                // Corda recall failed — still proceed to update H2
            }
            // 2. Always update H2 inventory to reflect recall
            medicineService.recallBatchInH2(batchNumber);
            return ResponseEntity.ok(Map.of(
                "recalled", cordaRecalled,
                "batchNumber", batchNumber,
                "inventoryCleared", true
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Transfer Event queries ────────────────────────────────────────────────

    @GetMapping("/medicines/{linearId}/events")
    public ResponseEntity<?> getMedicineEvents(@PathVariable String linearId, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        try {
            return ResponseEntity.ok(medicineService.getTransferEvents(linearId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/transfers/events")
    public ResponseEntity<?> getAllTransferEvents() {
        try {
            return ResponseEntity.ok(medicineService.getAllTransferEvents());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /**
     * Batch summary for the TRANSFER form — only shows batches with available stock.
     * availableCount = quantity - lockedQuantity
     * lockedCount    = lockedQuantity (in transit, not transferable again)
     */
    @GetMapping("/medicines/batches/summary")
    public ResponseEntity<?> getBatchesSummary(HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        if (orgId == null) return ResponseEntity.ok(new ArrayList<>());

        List<MedicineBatch> batches = medicineService.getBatchesByOrg(orgId);

        List<BatchSummaryResponse> result = batches.stream()
                .filter(b -> b.getAvailableQuantity() > 0)
                .map(MedicineController::toBatchSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Full inventory for the INVENTORY page — includes locked (in-transit) quantities.
     */
    @GetMapping("/medicines/inventory")
    public ResponseEntity<?> getInventory(HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        if (orgId == null) return ResponseEntity.ok(new ArrayList<>());

        List<MedicineBatch> batches = medicineService.getBatchesByOrg(orgId);

        List<BatchSummaryResponse> result = batches.stream()
                .filter(b -> b.getQuantity() > 0)
                .map(MedicineController::toBatchSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private static BatchSummaryResponse toBatchSummary(MedicineBatch b) {
        BatchSummaryResponse r = new BatchSummaryResponse();
        r.setBatchNumber(b.getBatchNumber());
        r.setMedicineName(b.getMedicineName());
        r.setGtin(b.getGtin()             != null ? b.getGtin()             : "");
        r.setExpiryDate(b.getExpiryDate() != null ? b.getExpiryDate()       : "");
        r.setCategory(b.getCategory()     != null ? b.getCategory()         : "");
        r.setStrength(b.getStrength()     != null ? b.getStrength()         : "");
        r.setStorageCondition(b.getStorageCondition() != null ? b.getStorageCondition() : "");
        r.setAvailableCount(b.getAvailableQuantity());
        r.setLockedCount(b.getLockedQuantity());
        r.setColdChainViolated(b.isColdChainViolated());
        return r;
    }

    /**
     * Near-expiry batches (across all orgs) — for regulator view.
     * ?days=90 (default 90)
     */
    @GetMapping("/medicines/near-expiry")
    public ResponseEntity<?> getNearExpiry(
            @RequestParam(defaultValue = "90") int days,
            HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();

        java.time.LocalDate today    = java.time.LocalDate.now();
        java.time.LocalDate deadline = today.plusDays(days);

        // Use H2 MedicineBatch — works across all orgs
        List<MedicineBatch> allBatches = medicineService.getAllBatches();

        List<Map<String, Object>> result = new ArrayList<>();
        for (MedicineBatch b : allBatches) {
            if (b.getQuantity() <= 0 || b.getExpiryDate() == null || b.getExpiryDate().isBlank()) continue;
            try {
                java.time.LocalDate expiry = java.time.LocalDate.parse(b.getExpiryDate());
                if (expiry.isBefore(today) || expiry.isAfter(deadline)) continue;
                long daysLeft = today.until(expiry, java.time.temporal.ChronoUnit.DAYS);
                String risk = daysLeft <= 30 ? "CRITICAL" : daysLeft <= 60 ? "WARNING" : "WATCH";

                String orgName = "";
                try { orgName = orgService.getById(b.getOrganizationId()).getOrganizationName(); } catch (Exception ignored) {}

                Map<String, Object> item = new java.util.LinkedHashMap<>();
                item.put("batchNumber",   b.getBatchNumber());
                item.put("medicineName",  b.getMedicineName());
                item.put("strength",      b.getStrength() != null ? b.getStrength() : "");
                item.put("quantity",      b.getQuantity());
                item.put("organizationId",   b.getOrganizationId());
                item.put("organizationName", orgName);
                item.put("expiryDate",    b.getExpiryDate());
                item.put("daysLeft",      daysLeft);
                item.put("risk",          risk);
                result.add(item);
            } catch (Exception ignored) {}
        }
        result.sort((a, b2) -> Long.compare((long) a.get("daysLeft"), (long) b2.get("daysLeft")));
        return ResponseEntity.ok(result);
    }

    /**
     * Critical (low) stock batches — for regulator and dashboard.
     * ?threshold=10 (default 10)
     */
    @GetMapping("/medicines/critical-stock")
    public ResponseEntity<?> getCriticalStock(
            @RequestParam(defaultValue = "10") int threshold,
            HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();

        List<MedicineBatch> allBatches = medicineService.getAllBatches();
        List<Map<String, Object>> result = new ArrayList<>();

        for (MedicineBatch b : allBatches) {
            if (b.getQuantity() <= 0 || b.getQuantity() >= threshold) continue;

            String orgName = "";
            try { orgName = orgService.getById(b.getOrganizationId()).getOrganizationName(); } catch (Exception ignored) {}

            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("batchNumber",      b.getBatchNumber());
            item.put("medicineName",     b.getMedicineName());
            item.put("strength",         b.getStrength() != null ? b.getStrength() : "");
            item.put("quantity",         b.getQuantity());
            item.put("organizationId",   b.getOrganizationId());
            item.put("organizationName", orgName);
            item.put("threshold",        threshold);
            result.add(item);
        }
        result.sort((a, b2) -> Integer.compare((int) a.get("quantity"), (int) b2.get("quantity")));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/medicines")
    public ResponseEntity<List<MedicineResponse>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @GetMapping("/medicines/{linearId}")
    public ResponseEntity<?> getMedicineById(@PathVariable String linearId) {
        try { return ResponseEntity.ok(medicineService.getMedicineById(linearId)); }
        catch (IllegalArgumentException e) { return ResponseEntity.notFound().build(); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/medicines/serial/{serialNumber}")
    public ResponseEntity<?> getBySerial(@PathVariable String serialNumber) {
        List<MedicineResponse> all = medicineService.getAllMedicines();
        return all.stream()
                .filter(m -> serialNumber.equals(m.getSerialNumber()))
                .findFirst()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/transfers/history/{medicineId}")
    public ResponseEntity<?> getTransferHistory(@PathVariable String medicineId) {
        try { return ResponseEntity.ok(medicineService.getMedicineHistory(medicineId)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/organizations")
    public ResponseEntity<?> getOrganizations(@RequestParam(required = false) String type) {
        if (type != null) return ResponseEntity.ok(orgService.getActiveByType(type));
        return ResponseEntity.ok(orgService.getAllActive());
    }

    @GetMapping("/node-info")
    public ResponseEntity<Map<String, String>> getNodeInfo() {
        return ResponseEntity.ok(Map.of("nodeName", medicineService.getMyNodeName()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isAuthenticated(HttpSession session) {
        return session.getAttribute("username") != null;
    }

    private boolean canRecall(HttpSession session) {
        String role = (String) session.getAttribute("role");
        return "ADMIN".equals(role) || "REGULATOR_USER".equals(role);
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Authentication required."));
    }

    private ResponseEntity<?> badRequest(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }
}
