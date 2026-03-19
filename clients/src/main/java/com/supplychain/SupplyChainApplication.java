package com.supplychain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the Supply Chain web application.
 * Each node (Manufacturer, Distributor, Retailer) runs its own instance
 * of this application, configured to connect to that node's RPC port.
 */
@SpringBootApplication
public class SupplyChainApplication {
    public static void main(String[] args) {
        SpringApplication.run(SupplyChainApplication.class, args);
    }
}
