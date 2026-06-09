package com.supplychain.controller;

import com.supplychain.dto.*;
import com.supplychain.service.OrganizationService;
import com.supplychain.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final OrganizationService orgService;
    private final UserService         userService;

    public AdminController(OrganizationService orgService, UserService userService) {
        this.orgService  = orgService;
        this.userService = userService;
    }

    // ── Organizations ─────────────────────────────────────────────────────────

    @GetMapping("/organizations")
    public ResponseEntity<?> listOrgs(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(orgService.getAll());
    }

    @GetMapping("/organizations/{id}")
    public ResponseEntity<?> getOrg(@PathVariable String id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        try { return ResponseEntity.ok(orgService.getById(id)); }
        catch (Exception e) { return ResponseEntity.notFound().build(); }
    }

    @PostMapping("/organizations")
    public ResponseEntity<?> createOrg(@RequestBody CreateOrganizationRequest req, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (isBlank(req.getOrganizationName())) return badRequest("organizationName required");
        if (isBlank(req.getOrganizationType())) return badRequest("organizationType required");
        try { return ResponseEntity.ok(orgService.create(req)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/organizations/{id}")
    public ResponseEntity<?> updateOrg(@PathVariable String id, @RequestBody CreateOrganizationRequest req,
                                        HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        try { return ResponseEntity.ok(orgService.update(id, req)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/organizations/{id}/toggle")
    public ResponseEntity<?> toggleOrg(@PathVariable String id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        try { orgService.toggleStatus(id); return ResponseEntity.ok(Map.of("message", "Status toggled.")); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        try { return ResponseEntity.ok(userService.getById(id)); }
        catch (Exception e) { return ResponseEntity.notFound().build(); }
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest req, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (isBlank(req.getUsername())) return badRequest("username required");
        if (isBlank(req.getPassword())) return badRequest("password required");
        if (isBlank(req.getRole()))     return badRequest("role required");
        try { return ResponseEntity.ok(userService.create(req)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody CreateUserRequest req,
                                         HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        try { return ResponseEntity.ok(userService.update(id, req)); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<?> toggleUser(@PathVariable String id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        try { userService.toggleStatus(id); return ResponseEntity.ok(Map.of("message", "Status toggled.")); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("role"));
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(403).body(Map.of("error", "Admin access required."));
    }

    private ResponseEntity<?> badRequest(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }
}
