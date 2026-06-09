package com.supplychain.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards React client-side routes to index.html so React Router handles navigation.
 * Static assets and /api/** are served normally by Spring Boot — only UI routes land here.
 */
@Controller
public class SpaController {

    @GetMapping({"/", "/login", "/dashboard",
                 "/admin", "/admin/organizations", "/admin/users",
                 "/medicines", "/medicines/batch/create",
                 "/medicines/transfer", "/medicines/dispense",
                 "/audit"})
    public String spa() {
        return "forward:/index.html";
    }

    @GetMapping("/medicines/{id}")
    public String medicineDetail() {
        return "forward:/index.html";
    }
}
