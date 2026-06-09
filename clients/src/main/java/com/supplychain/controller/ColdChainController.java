package com.supplychain.controller;

import com.supplychain.dto.ColdChainRecordRequest;
import com.supplychain.service.ColdChainService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/cold-chain")
public class ColdChainController {

    private final ColdChainService coldChainService;

    public ColdChainController(ColdChainService coldChainService) {
        this.coldChainService = coldChainService;
    }

    @PostMapping("/{transferRequestId}")
    public ResponseEntity<?> submit(@PathVariable String transferRequestId,
                                     @RequestBody ColdChainRecordRequest req,
                                     HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        String user = (String) session.getAttribute("username");
        try {
            return ResponseEntity.ok(coldChainService.submitColdChain(transferRequestId, req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{transferRequestId}")
    public ResponseEntity<?> get(@PathVariable String transferRequestId, HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        return coldChainService.getByTransferRequestId(transferRequestId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/violations")
    public ResponseEntity<?> violations(HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        try { return ResponseEntity.ok(coldChainService.getAllViolations()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping
    public ResponseEntity<?> all(HttpSession session) {
        if (!isAuth(session)) return unauthorized();
        try { return ResponseEntity.ok(coldChainService.getAll()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    private boolean isAuth(HttpSession session) { return session.getAttribute("username") != null; }
    private ResponseEntity<?> unauthorized() { return ResponseEntity.status(401).body(Map.of("error", "Giriş gerekli.")); }
}
