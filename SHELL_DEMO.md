# Supply Chain CorDapp – Shell Demo Guide

## 1. Build & Deploy Nodes

```bash
# Build the project and deploy nodes
./gradlew clean deployNodes

# Start all nodes (Windows)
build\nodes\runnodes.bat
```

## 2. Connect to Node Shells

Each node opens its own terminal window.
You can also connect via SSH using the RPC port defined in build.gradle.

---

## 3. Demo Sequence

### Step 1 – Manufacturer creates a product

On the **Manufacturer** node shell:

```
flow start CreateProductFlow productName: "Laptop Model X", serialNumber: "SN-2024-001", owner: "O=Manufacturer,L=New York,C=US"
```

Note the `linearId` from the output (e.g., `12345678-1234-1234-1234-123456789abc`).

### Step 2 – Verify product in Manufacturer's vault

On the **Manufacturer** node shell:

```
run vaultQuery contractStateType: com.supplychain.states.ProductState
```

You should see the product with `status: CREATED` and `owner: Manufacturer`.

---

### Step 3 – Manufacturer transfers to Distributor

On the **Manufacturer** node shell (replace the UUID with your actual linearId):

```
flow start TransferProductFlow linearId: "12345678-1234-1234-1234-123456789abc", newOwner: "O=Distributor,L=Paris,C=FR"
```

### Step 4 – Verify product in Distributor's vault

On the **Distributor** node shell:

```
run vaultQuery contractStateType: com.supplychain.states.ProductState
```

You should see the product with `status: TRANSFERRED` and `owner: Distributor`.

---

### Step 5 – Distributor transfers to Retailer

On the **Distributor** node shell:

```
flow start TransferProductFlow linearId: "12345678-1234-1234-1234-123456789abc", newOwner: "O=Retailer,L=Berlin,C=DE"
```

### Step 6 – Verify final ownership in Retailer's vault

On the **Retailer** node shell:

```
run vaultQuery contractStateType: com.supplychain.states.ProductState
```

You should see the product with `status: TRANSFERRED` and `owner: Retailer`.

---

## 4. Contract Verification Tests

The contract will **reject** any transaction that violates the rules.

Example invalid attempt – Transfer without changing owner (will fail):
The contract checks: `"Transfer: Owner must change."` – this prevents transferring to the same party.

Example invalid attempt – Create with empty productName (will fail):
The contract checks: `"Create: productName must not be blank."`

---

## 5. Node Ports Reference

| Node         | P2P Port | RPC Port | Admin Port |
|--------------|----------|----------|------------|
| Notary       | 10002    | 10003    | 10043      |
| Manufacturer | 10005    | 10006    | 10046      |
| Distributor  | 10008    | 10009    | 10049      |
| Retailer     | 10011    | 10012    | 10052      |
