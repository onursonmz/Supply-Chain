package com.supplychain.controller;

import com.supplychain.dto.CreateDistributorOrderRequest;
import com.supplychain.dto.CreateTransferRequestDto;
import com.supplychain.dto.MedicineResponse;
import com.supplychain.entity.MedicineBatch;
import com.supplychain.service.ColdChainService;
import com.supplychain.service.DistributorOrderService;
import com.supplychain.service.MedicineService;
import com.supplychain.service.OrganizationService;
import com.supplychain.service.TransferRequestService;
import org.springframework.http.ResponseEntity;
import com.supplychain.repository.ColdChainRecordRepository;
import com.supplychain.repository.TransferRequestRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final MedicineService             medicineService;
    private final OrganizationService         orgService;
    private final TransferRequestService      transferRequestService;
    private final DistributorOrderService     orderService;
    private final ColdChainRecordRepository   coldChainRepo;
    private final TransferRequestRepository   transferRepo;

    public DemoController(MedicineService medicineService,
                           OrganizationService orgService,
                           TransferRequestService transferRequestService,
                           ColdChainService coldChainService,
                           DistributorOrderService orderService,
                           ColdChainRecordRepository coldChainRepo,
                           TransferRequestRepository transferRepo) {
        this.medicineService        = medicineService;
        this.orgService             = orgService;
        this.transferRequestService = transferRequestService;
        this.orderService           = orderService;
        this.coldChainRepo          = coldChainRepo;
        this.transferRepo           = transferRepo;
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seed(HttpSession session) {
        String role  = (String) session.getAttribute("role");
        String orgId = (String) session.getAttribute("organizationId");
        if (role == null) return ResponseEntity.status(401).body(Map.of("error", "Giriş gerekli."));
        if (!"ADMIN".equals(role) && !"MANUFACTURER_USER".equals(role))
            return ResponseEntity.status(403).body(Map.of("error", "Yalnızca ADMIN veya Üretici demo veri oluşturabilir."));

        String orgName = "";
        try { orgName = orgService.findEntityById(orgId).getOrganizationName(); } catch (Exception ignored) {}
        if (orgName.isBlank()) orgName = "ABC Pharma";

        final String finalOrgName = orgName;

        // ── Medicine definitions ───────────────────────────────────────────────
        record Med(String name, String gtin, String batch, String cat, String str,
                   String form, String expiry, String storage, int qty) {}

        List<Med> meds = List.of(
            // Near-expiry: CRITICAL (<=30 days)
            new Med("Parol 500mg",       "05000174013662", "PAR-001", "Analjezik",   "500mg",  "Tablet",    LocalDate.now().plusDays(12).toString(),  "2-8°C",          60),
            new Med("Cipro 500mg",       "04016369500285", "CIP-001", "Antibiyotik", "500mg",  "Tablet",    LocalDate.now().plusDays(22).toString(),  "15-25°C",        5),
            // Near-expiry: WARNING (<=60 days)
            new Med("Arveles 25mg",      "04008076004788", "ARV-001", "Analjezik",   "25mg",   "Kapsül",    LocalDate.now().plusDays(45).toString(),  "15-25°C",        40),
            new Med("Majezik 100mg",     "08690808050050", "MAJ-001", "Analjezik",   "100mg",  "Tablet",    LocalDate.now().plusDays(58).toString(),  "15-25°C",        50),
            // Near-expiry: WATCH (<=90 days)
            new Med("İnsülin Glargine",  "00000000000001", "INS-001", "Diyabet",     "100 IU", "Enjeksiyon",LocalDate.now().plusDays(75).toString(), "2-8°C",          8),
            new Med("Ventolin 100mcg",   "08697515460105", "VEN-001", "Solunum",     "100mcg", "İnhaler",   LocalDate.now().plusDays(85).toString(), "15-25°C",        15),
            // Normal stock
            new Med("Augmentin 1g",      "08699533002345", "AUG-001", "Antibiyotik", "1g",     "Tablet",    LocalDate.now().plusYears(1).toString(),  "15-25°C",        30),
            new Med("Aspirin 100mg",     "05000174036548", "ASP-001", "Kardiyoloji", "100mg",  "Tablet",    LocalDate.now().plusYears(2).toString(),  "15-25°C",        100),
            // Critical stock: qty <= 5
            new Med("Metformin 850mg",   "08699533009001", "MET-001", "Diyabet",     "850mg",  "Tablet",    LocalDate.now().plusMonths(8).toString(), "15-25°C",        3),
            new Med("Losartan 50mg",     "08699533009002", "LOS-001", "Kardiyoloji", "50mg",   "Tablet",    LocalDate.now().plusYears(1).toString(),  "15-25°C",        4)
        );

        List<Map<String, Object>> results = new ArrayList<>();
        int totalCreated = 0;

        for (Med m : meds) {
            try {
                MedicineBatch batch = new MedicineBatch(
                    "DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                    m.name(), m.gtin(), m.batch(), finalOrgName, m.expiry(),
                    m.cat(), m.qty(), orgId,
                    "Demo verisi — " + m.name(), m.str(), m.form(), m.storage()
                );
                medicineService.saveBatch(batch);
                List<MedicineResponse> created = medicineService.createBatch(batch, orgId, finalOrgName);
                totalCreated += created.size();
                results.add(Map.of("batch", m.batch(), "name", m.name(), "qty", created.size(), "expiry", m.expiry()));
            } catch (Exception e) {
                results.add(Map.of("batch", m.batch(), "error", e.getMessage()));
            }
        }

        // ── Transfer chain: manufacturer → distributor ─────────────────────────
        int transferred = 0;
        String[][] transfers1 = {
            {"PAR-001", "Parol 500mg",   "20"},
            {"ARV-001", "Arveles 25mg",  "15"},
            {"MAJ-001", "Majezik 100mg", "20"},
            {"AUG-001", "Augmentin 1g",  "10"},
            {"ASP-001", "Aspirin 100mg", "30"},
            {"MET-001", "Metformin 850mg","2"},
        };
        for (String[] t : transfers1) {
            try {
                var dto = new CreateTransferRequestDto();
                dto.setBatchNumber(t[0]);
                dto.setMedicineName(t[1]);
                dto.setQuantity(Integer.parseInt(t[2]));
                dto.setTargetOrganizationId("ORG-002");
                dto.setNotes("Demo: Üretici → Anadolu Ecza Deposu");
                var req = transferRequestService.createRequest(dto, orgId, finalOrgName, "abc_pharma_user");
                transferRequestService.dispatchRequest(req.getTransferRequestId(), "abc_pharma_user");
                transferred++;
            } catch (Exception ignored) {}
        }

        // ── Transfer chain: distributor → pharmacy (using H2 direct batch injection) ─
        // Since we can only dispatch from the current (manufacturer) node,
        // we inject batches directly for distributors and pharmacies to simulate
        // a complete supply chain for the demo.
        int injected = injectDistributorAndPharmacyBatches();

        // ── Distributor orders ─────────────────────────────────────────────────
        String[][] orders = {
            {"Parol 500mg",  "50"},
            {"Arveles 25mg", "30"},
        };
        int ordersCreated = 0;
        for (String[] o : orders) {
            try {
                var ord = new CreateDistributorOrderRequest();
                ord.setManufacturerOrgId(orgId);
                ord.setMedicineName(o[0]);
                ord.setQuantity(Integer.parseInt(o[1]));
                ord.setDescription("Demo rutin sipariş");
                orderService.createOrder(ord, "ORG-002", "Anadolu Ecza Deposu", "anadolu_user");
                ordersCreated++;
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(Map.of(
            "message",      "Demo verisi başarıyla oluşturuldu.",
            "totalCreated", totalCreated,
            "transferred",  transferred,
            "injected",     injected,
            "orders",       ordersCreated,
            "batches",      results
        ));
    }

    /**
     * Injects MedicineBatch records directly for distributor (ORG-002) and
     * pharmacy (ORG-004) to simulate a complete supply chain without needing
     * multi-node Corda for the demo presentation.
     */
    private int injectDistributorAndPharmacyBatches() {
        int count = 0;

        record BatchDef(String orgId, String name, String gtin, String batch,
                        String mfr, String expiry, String cat, int qty,
                        String str, String form, String storage) {}

        // Anadolu Ecza Deposu (ORG-002) already-received stock
        String mfr = "ABC Pharma";
        List<BatchDef> distBatches = List.of(
            new BatchDef("ORG-002", "Augmentin 1g",   "08699533002345","AUG-001", mfr, LocalDate.now().plusYears(1).toString(),  "Antibiyotik",  12, "1g",     "Tablet",   "15-25°C"),
            new BatchDef("ORG-002", "Aspirin 100mg",  "05000174036548","ASP-001", mfr, LocalDate.now().plusYears(2).toString(),  "Kardiyoloji",  18, "100mg",  "Tablet",   "15-25°C"),
            new BatchDef("ORG-002", "Ventolin 100mcg","08697515460105","VEN-001", mfr, LocalDate.now().plusDays(85).toString(),  "Solunum",       7, "100mcg", "İnhaler",  "15-25°C"),
            new BatchDef("ORG-002", "Cipro 500mg",    "04016369500285","CIP-001", mfr, LocalDate.now().plusDays(22).toString(),  "Antibiyotik",   3, "500mg",  "Tablet",   "15-25°C"),
            new BatchDef("ORG-002", "Parol 500mg",    "05000174013662","PAR-001", mfr, LocalDate.now().plusDays(12).toString(),  "Analjezik",     9, "500mg",  "Tablet",   "2-8°C")
        );

        // Alsancak Eczanesi (ORG-004) already-received stock
        List<BatchDef> pharmBatches = List.of(
            new BatchDef("ORG-004", "Aspirin 100mg",  "05000174036548","ASP-001", mfr, LocalDate.now().plusYears(2).toString(),  "Kardiyoloji",  8,  "100mg", "Tablet",  "15-25°C"),
            new BatchDef("ORG-004", "Ventolin 100mcg","08697515460105","VEN-001", mfr, LocalDate.now().plusDays(85).toString(),  "Solunum",       4,  "100mcg","İnhaler", "15-25°C"),
            new BatchDef("ORG-004", "Parol 500mg",    "05000174013662","PAR-001", mfr, LocalDate.now().plusDays(12).toString(),  "Analjezik",     2,  "500mg", "Tablet",  "2-8°C"),
            new BatchDef("ORG-004", "Arveles 25mg",   "04008076004788","ARV-001", mfr, LocalDate.now().plusDays(45).toString(),  "Analjezik",     5,  "25mg",  "Kapsül",  "15-25°C")
        );

        List<BatchDef> all = new ArrayList<>(distBatches);
        all.addAll(pharmBatches);

        for (BatchDef bd : all) {
            try {
                // Skip if already exists for this org
                if (medicineService.findBatchByOrgAndBatchNumber(bd.orgId(), bd.batch()).isPresent()) continue;

                MedicineBatch b = new MedicineBatch(
                    "INJ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                    bd.name(), bd.gtin(), bd.batch(), bd.mfr(), bd.expiry(), bd.cat(),
                    bd.qty(), bd.orgId(),
                    "Demo inject (simulated transfer accepted)", bd.str(), bd.form(), bd.storage()
                );
                medicineService.saveBatch(b);

                // Audit trail
                String orgName = "";
                try { orgName = orgService.findEntityById(bd.orgId()).getOrganizationName(); } catch (Exception ignored) {}
                medicineService.recordBatchTransferEvent(bd.name(), bd.batch(),
                    "ORG-001", "ABC Pharma", bd.orgId(), orgName, "TRANSFERRED", "demo");
                count++;
            } catch (Exception ignored) {}
        }
        return count;
    }

    /**
     * Clears ALL inventory, transfer, and cold-chain data from H2.
     * Organizations and users are preserved.
     * ADMIN only.
     */
    @PostMapping("/clear")
    public ResponseEntity<?> clearAllData(HttpSession session) {
        String role = (String) session.getAttribute("role");
        if (!"ADMIN".equals(role))
            return ResponseEntity.status(403).body(Map.of("error", "Yalnızca Admin veri temizleyebilir."));
        try {
            coldChainRepo.deleteAll();
            transferRepo.deleteAll();
            medicineService.clearAllInventoryData();
            return ResponseEntity.ok(Map.of(
                "message", "Tüm envanter, transfer ve soğuk zincir verileri temizlendi. Kuruluşlar ve kullanıcılar korundu.",
                "cleared", true
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
