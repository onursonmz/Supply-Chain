package com.supplychain.controller;

import com.supplychain.dto.CreateProductRequest;
import com.supplychain.dto.ProductResponse;
import com.supplychain.dto.TransferProductRequest;
import com.supplychain.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller exposing supply chain operations over HTTP.
 *
 * Endpoints:
 *   GET  /api/node-info              → current node name
 *   POST /api/products               → create product
 *   POST /api/products/transfer      → transfer product
 *   GET  /api/products               → list all products
 *   GET  /api/products/{linearId}    → get product by ID
 */
@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // -------------------------------------------------------------------------
    // Node info
    // -------------------------------------------------------------------------

    @GetMapping("/node-info")
    public ResponseEntity<Map<String, String>> getNodeInfo() {
        return ResponseEntity.ok(Map.of("nodeName", productService.getMyNodeName()));
    }

    // -------------------------------------------------------------------------
    // Create product
    // -------------------------------------------------------------------------

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody CreateProductRequest request) {
        if (request.getProductName() == null || request.getProductName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "productName is required"));
        }
        if (request.getSerialNumber() == null || request.getSerialNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "serialNumber is required"));
        }
        try {
            ProductResponse response = productService.createProduct(
                    request.getProductName(),
                    request.getSerialNumber()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Transfer product
    // -------------------------------------------------------------------------

    @PostMapping("/products/transfer")
    public ResponseEntity<?> transferProduct(@RequestBody TransferProductRequest request) {
        if (request.getLinearId() == null || request.getLinearId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "linearId is required"));
        }
        if (request.getNewOwner() == null || request.getNewOwner().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "newOwner is required"));
        }
        try {
            ProductResponse response = productService.transferProduct(
                    request.getLinearId(),
                    request.getNewOwner()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // List products
    // -------------------------------------------------------------------------

    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // -------------------------------------------------------------------------
    // Get by ID
    // -------------------------------------------------------------------------

    @GetMapping("/products/{linearId}")
    public ResponseEntity<?> getProductById(@PathVariable String linearId) {
        try {
            return ResponseEntity.ok(productService.getProductById(linearId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
