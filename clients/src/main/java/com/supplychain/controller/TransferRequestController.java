package com.supplychain.controller;

import com.supplychain.dto.CreateTransferRequestDto;
import com.supplychain.dto.TransferRequestResponse;
import com.supplychain.service.OrganizationService;
import com.supplychain.service.TransferRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transfer-requests")
public class TransferRequestController {

    private final TransferRequestService transferRequestService;
    private final OrganizationService    orgService;

    public TransferRequestController(TransferRequestService transferRequestService,
                                      OrganizationService orgService) {
        this.transferRequestService = transferRequestService;
        this.orgService             = orgService;
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody CreateTransferRequestDto dto, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId   = (String) session.getAttribute("organizationId");
        String orgName = resolveOrgName(orgId);
        String user    = (String) session.getAttribute("username");

        if (isBlank(dto.getBatchNumber()))          return badRequest("batchNumber zorunludur.");
        if (dto.getQuantity() < 1)                  return badRequest("Miktar en az 1 olmalıdır.");
        if (isBlank(dto.getTargetOrganizationId())) return badRequest("targetOrganizationId zorunludur.");

        try {
            TransferRequestResponse result = transferRequestService.createRequest(dto, orgId, orgName, user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DIRECT TRANSFER: Creates and dispatches in one atomic step.
     * Inventory is updated immediately — no separate "pending" phase.
     */
    @PostMapping("/direct")
    public ResponseEntity<?> transferDirect(@RequestBody CreateTransferRequestDto dto, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId   = (String) session.getAttribute("organizationId");
        String orgName = resolveOrgName(orgId);
        String user    = (String) session.getAttribute("username");

        if (isBlank(dto.getBatchNumber()))          return badRequest("batchNumber zorunludur.");
        if (dto.getQuantity() < 1)                  return badRequest("Miktar en az 1 olmalıdır.");
        if (isBlank(dto.getTargetOrganizationId())) return badRequest("targetOrganizationId zorunludur.");

        try {
            TransferRequestResponse result = transferRequestService.transferDirect(dto, orgId, orgName, user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<?> dispatch(@PathVariable String id, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String user = (String) session.getAttribute("username");
        try {
            return ResponseEntity.ok(transferRequestService.dispatchRequest(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String id, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        try {
            return ResponseEntity.ok(transferRequestService.cancelRequest(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable String id, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String user = (String) session.getAttribute("username");
        try {
            // acceptRequest only updates H2 — no Corda needed, no checked exception
            return ResponseEntity.ok(transferRequestService.acceptRequest(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id,
                                     @RequestBody(required = false) Map<String, String> body,
                                     HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String user   = (String) session.getAttribute("username");
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        try {
            // rejectRequest performs a reverse Corda transfer (receiver → original sender)
            return ResponseEntity.ok(transferRequestService.rejectRequest(id, user, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/incoming")
    public ResponseEntity<?> getIncoming(HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        try {
            return ResponseEntity.ok(transferRequestService.getIncomingRequests(orgId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** Returns a violated batch to the original sender (reverse transfer). */
    @PostMapping("/return")
    public ResponseEntity<?> returnToSender(@RequestBody Map<String, String> body, HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String originalId = body.get("transferRequestId");
        if (isBlank(originalId)) return badRequest("transferRequestId zorunludur.");
        String user = (String) session.getAttribute("username");
        try {
            TransferRequestResponse result = transferRequestService.returnToSender(originalId, user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending-acceptance")
    public ResponseEntity<?> getPendingAcceptance(HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        try {
            return ResponseEntity.ok(transferRequestService.getPendingAcceptance(orgId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/outgoing")
    public ResponseEntity<?> getOutgoing(HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        String orgId = (String) session.getAttribute("organizationId");
        try {
            List<TransferRequestResponse> list = transferRequestService.getOutgoingRequests(orgId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll(HttpSession session) {
        if (!isAuthenticated(session)) return unauthorized();
        try {
            return ResponseEntity.ok(transferRequestService.getAllRequests());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private String resolveOrgName(String orgId) {
        if (orgId == null) return "";
        try { return orgService.findEntityById(orgId).getOrganizationName(); } catch (Exception e) { return ""; }
    }

    private boolean isAuthenticated(HttpSession session) { return session.getAttribute("username") != null; }
    private boolean isBlank(String s) { return s == null || s.isBlank(); }
    private ResponseEntity<?> unauthorized() { return ResponseEntity.status(401).body(Map.of("error", "Giriş gerekli.")); }
    private ResponseEntity<?> badRequest(String msg) { return ResponseEntity.badRequest().body(Map.of("error", msg)); }
}
