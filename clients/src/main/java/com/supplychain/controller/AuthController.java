package com.supplychain.controller;

import com.supplychain.dto.LoginRequest;
import com.supplychain.dto.LoginResponse;
import com.supplychain.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        if (request.getUsername() == null || request.getPassword() == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required."));

        LoginResponse response = authService.login(request.getUsername(), request.getPassword());
        if (response == null)
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials or not authorized on this node."));

        session.setAttribute("username",       response.getUsername());
        session.setAttribute("role",           response.getRole());
        session.setAttribute("organizationId", response.getOrganizationId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated."));
        LoginResponse response = authService.getUserInfo(username);
        if (response == null) return ResponseEntity.status(401).body(Map.of("error", "Session invalid."));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out."));
    }

    @GetMapping("/node-info")
    public ResponseEntity<?> nodeInfo() {
        return ResponseEntity.ok(Map.of("nodeRole", authService.getNodeRole()));
    }
}
