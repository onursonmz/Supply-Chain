package com.supplychain.controller;

import com.supplychain.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * Public (authenticated) organization lookup endpoint.
 * Used by all roles to populate dropdowns — does NOT require ADMIN.
 */
@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService orgService;

    public OrganizationController(OrganizationService orgService) {
        this.orgService = orgService;
    }

    /** Returns all ACTIVE organizations, optionally filtered by type. */
    @GetMapping("/active")
    public ResponseEntity<?> getActive(
            @RequestParam(required = false) String type,
            HttpSession session) {

        if (session.getAttribute("username") == null)
            return ResponseEntity.status(401).body(Map.of("error", "Giriş gerekli."));

        try {
            if (type != null && !type.isBlank()) {
                return ResponseEntity.ok(orgService.getActiveByType(type.toUpperCase()));
            }
            return ResponseEntity.ok(orgService.getAllActive());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
