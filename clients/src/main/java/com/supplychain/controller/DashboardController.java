package com.supplychain.controller;

import com.supplychain.dto.DashboardResponse;
import com.supplychain.dto.MedicineResponse;
import com.supplychain.entity.MedicineBatch;
import com.supplychain.service.ColdChainService;
import com.supplychain.service.DistributorOrderService;
import com.supplychain.service.MedicineService;
import com.supplychain.service.OrganizationService;
import com.supplychain.service.TransferRequestService;
import com.supplychain.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final MedicineService          medicineService;
    private final OrganizationService      orgService;
    private final UserService              userService;
    private final TransferRequestService   transferRequestService;
    private final ColdChainService         coldChainService;
    private final DistributorOrderService  orderService;

    public DashboardController(MedicineService medicineService,
                                OrganizationService orgService,
                                UserService userService,
                                TransferRequestService transferRequestService,
                                ColdChainService coldChainService,
                                DistributorOrderService orderService) {
        this.medicineService        = medicineService;
        this.orgService             = orgService;
        this.userService            = userService;
        this.transferRequestService = transferRequestService;
        this.coldChainService       = coldChainService;
        this.orderService           = orderService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(HttpSession session) {
        try {
            String role     = (String) session.getAttribute("role");
            String orgId    = (String) session.getAttribute("organizationId");
            String nodeName = medicineService.getMyNodeName();

            DashboardResponse resp = new DashboardResponse();
            resp.setNodeName(nodeName);
            resp.setRole(role);

            List<MedicineResponse> all = medicineService.getAllMedicines();
            int nearExpiry = (int) all.stream().filter(m -> isNearExpiry(m.getExpiryDate())).count();

            resp.setTransferredCount((int) transferRequestService.countAccepted());
            resp.setTodayTransferCount((int) transferRequestService.countTransferredToday());

            // Critical stock: batches with quantity < 10 across all orgs
            int criticalStock = (int) medicineService.getAllBatches().stream()
                    .filter(b -> b.getQuantity() > 0 && b.getQuantity() < 10)
                    .count();
            resp.setCriticalStockCount(criticalStock);

            if (orgId != null) {
                resp.setPendingTransferCount((int) transferRequestService.countPending(orgId));
                resp.setPendingAcceptanceCount(0); // mal kabul kaldırıldı

                // H2 batch'lerden gerçek envanter sayısı — Corda vault değil
                int myStock = medicineService.getBatchesByOrg(orgId).stream()
                        .filter(b -> b.getQuantity() > 0)
                        .mapToInt(MedicineBatch::getQuantity)
                        .sum();
                resp.setMyOrganizationCount(myStock);

                // Gelen / Giden transfer sayıları (H2 tabanlı)
                resp.setIncomingTransferCount((int) transferRequestService.countIncomingTransferred(orgId));
                resp.setOutgoingTransferCount((int) transferRequestService.countOutgoingTransferred(orgId));

                try { resp.setOrganizationName(orgService.getById(orgId).getOrganizationName()); } catch (Exception ignored) {}
            }

            if (orgId != null && ("MANUFACTURER_USER".equals(role) || "DISTRIBUTOR_USER".equals(role))) {
                resp.setPendingOrderCount((int) orderService.countPendingForManufacturer(orgId));
            }

            if ("ADMIN".equals(role)) {
                resp.setTotalOrganizations((int) orgService.countAll());
                resp.setTotalUsers((int) userService.countAll());
                resp.setTotalManufacturers((int) orgService.countByType("MANUFACTURER"));
                resp.setTotalDistributors((int) orgService.countByType("DISTRIBUTOR"));
                resp.setTotalPharmacies((int) orgService.countByType("PHARMACY"));
                resp.setTotalMedicines(all.size());
                resp.setCreatedCount((int) all.stream().filter(m -> "CREATED".equals(m.getStatus())).count());
                resp.setInDistributionCount((int) all.stream().filter(m -> "IN_DISTRIBUTION".equals(m.getStatus())).count());
                resp.setAtPharmacyCount((int) all.stream().filter(m -> "AT_PHARMACY".equals(m.getStatus())).count());
                resp.setDispensedCount((int) all.stream().filter(m -> "DISPENSED_TO_PATIENT".equals(m.getStatus())).count());
                resp.setRecalledCount((int) all.stream().filter(m -> "RECALLED".equals(m.getStatus())).count());
                resp.setNearExpiryCount(nearExpiry);
                resp.setRecentMedicines(all.stream().limit(5).collect(Collectors.toList()));
            } else {
                resp.setTotalMedicines(all.size());
                resp.setTotalTransfers(medicineService.getTotalTransfers());
                resp.setCreatedCount((int) all.stream().filter(m -> "CREATED".equals(m.getStatus())).count());
                resp.setInDistributionCount((int) all.stream().filter(m -> "IN_DISTRIBUTION".equals(m.getStatus())).count());
                resp.setAtPharmacyCount((int) all.stream().filter(m -> "AT_PHARMACY".equals(m.getStatus())).count());
                resp.setDispensedCount((int) all.stream().filter(m -> "DISPENSED_TO_PATIENT".equals(m.getStatus())).count());
                resp.setRecalledCount((int) all.stream().filter(m -> "RECALLED".equals(m.getStatus())).count());
                resp.setNearExpiryCount(nearExpiry);
                resp.setRecentMedicines(all.stream().limit(5).collect(Collectors.toList()));
            }

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isNearExpiry(String expiryDate) {
        if (expiryDate == null || expiryDate.isBlank()) return false;
        try {
            LocalDate expiry    = LocalDate.parse(expiryDate);
            LocalDate today     = LocalDate.now();
            LocalDate threshold = today.plusDays(60);
            return expiry.isAfter(today) && expiry.isBefore(threshold);
        } catch (Exception e) {
            return false;
        }
    }
}
