package com.supplychain.controller;

import com.supplychain.dto.CreateDistributorOrderRequest;
import com.supplychain.service.DistributorOrderService;
import com.supplychain.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/distributor-orders")
public class DistributorOrderController {

    private final DistributorOrderService orderService;
    private final OrganizationService     orgService;

    public DistributorOrderController(DistributorOrderService orderService,
                                       OrganizationService orgService) {
        this.orderService = orderService;
        this.orgService   = orgService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateDistributorOrderRequest req, HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        String role    = (String) session.getAttribute("role");
        if (!"DISTRIBUTOR_USER".equals(role) && !"PHARMACY_USER".equals(role))
            return ResponseEntity.status(403).body(Map.of("error", "Yalnızca dağıtıcı veya eczane talep oluşturabilir."));

        String orgId   = (String) session.getAttribute("organizationId");
        String orgName = resolveOrgName(orgId);
        String user    = (String) session.getAttribute("username");

        try {
            return ResponseEntity.ok(orderService.createOrder(req, orgId, orgName, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id, HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        String role = (String) session.getAttribute("role");
        if (!"MANUFACTURER_USER".equals(role) && !"DISTRIBUTOR_USER".equals(role) && !"ADMIN".equals(role))
            return ResponseEntity.status(403).body(Map.of("error", "Yalnızca üretici veya dağıtıcı onaylayabilir."));

        String user = (String) session.getAttribute("username");
        try {
            return ResponseEntity.ok(orderService.approveOrder(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id,
                                     @RequestBody(required = false) Map<String, String> body,
                                     HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        String role = (String) session.getAttribute("role");
        if (!"MANUFACTURER_USER".equals(role) && !"DISTRIBUTOR_USER".equals(role) && !"ADMIN".equals(role))
            return ResponseEntity.status(403).body(Map.of("error", "Yalnızca üretici veya dağıtıcı reddedebilir."));

        String user   = (String) session.getAttribute("username");
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        try {
            return ResponseEntity.ok(orderService.rejectOrder(id, user, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> myOrders(HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        try { return ResponseEntity.ok(orderService.getMyOrders(orgId)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/incoming")
    public ResponseEntity<?> incoming(HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        try { return ResponseEntity.ok(orderService.getIncomingOrders(orgId)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping
    public ResponseEntity<?> all(HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        try { return ResponseEntity.ok(orderService.getAllOrders()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    private String resolveOrgName(String orgId) {
        if (orgId == null) return "";
        try { return orgService.findEntityById(orgId).getOrganizationName(); } catch (Exception e) { return ""; }
    }

    private boolean isAuth(HttpSession s) { return s.getAttribute("username") != null; }
    private ResponseEntity<?> unauthorized() { return ResponseEntity.status(401).body(Map.of("error", "Giriş gerekli.")); }
}
