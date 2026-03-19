package com.supplychain.dto;

/**
 * Request body for POST /api/products
 */
public class CreateProductRequest {
    private String productName;
    private String serialNumber;

    public CreateProductRequest() {}

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
}
