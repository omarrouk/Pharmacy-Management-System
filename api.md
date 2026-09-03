# Pharmacy Management System — API Guide (Postman)

Use this document to build a Postman collection and test the full backend.

---

## 0) Setup

### Base URL

```
http://localhost:3000
```

### Test login (System Admin)

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `********` |

> Dev seed account only. Change before production.

### Postman settings

1. Create collection: **Pharmacy Management System**
2. Collection variable: `baseUrl` = `http://localhost:3000`
3. Enable **Cookies** (HttpOnly cookies after login)
4. Do **not** send Authorization Bearer headers
5. All bodies = JSON (`Content-Type: application/json`)

### Cookies after login

| Cookie | Path |
|---|---|
| `accessToken` | `/api/v1` |
| `refreshToken` | `/api/v1/auth` |

### Collection variables (save as you go)

| Variable | Source |
|---|---|
| `warehouseId` | Create / list warehouse |
| `pharmacyId` | Create / list pharmacy |
| `categoryId` | Create category |
| `manufacturerId` | Create manufacturer |
| `ingredientId` | Create active ingredient |
| `drugId` | Create drug |
| `batchId` | Create batch / purchase receive |
| `supplierId` | Create supplier |
| `paymentMethodId` | Create payment method |
| `purchaseRequestId` | Create purchase request |
| `purchaseOrderId` | Approve / auto-approve purchase |
| `supplyRequestId` | Create supply request |
| `shipmentId` | Prepare shipment |
| `salesInvoiceId` | Create sales invoice |
| `customerReturnId` | Create customer return |
| `pharmacyReturnId` | Create pharmacy return |

### ID rules

- Every Mongo id is a **24-character hex string**
- Copy `data.id` or `data.items[].id` from responses
- Wrong: `"{abc...}"` or `{abc...}`
- Right: `abc...` or Postman `{{drugId}}`

### Standard response shape

Success:
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "...",
  "data": { "code": "ERROR_CODE" }
}
```

---

## MASTER END-TO-END TEST FLOW

Run these requests **in order**. After each create, save the returned `id` into a collection variable.

### Phase A — Auth & health

| # | Request name | Method | URL |
|---|---|---|---|
| A1 | Health check | `GET` | `{{baseUrl}}/api/v1/health` |
| A2 | Login as admin | `POST` | `{{baseUrl}}/api/v1/auth/login` |
| A3 | Current user | `GET` | `{{baseUrl}}/api/v1/auth/me` |

**A2 Login body**
```json
{
  "email": "admin@example.com",
  "password": "*******"
}
```

---

### Phase B — Locations

| # | Request name | Method | URL |
|---|---|---|---|
| B1 | Create warehouse | `POST` | `{{baseUrl}}/api/v1/warehouses` |
| B2 | Create pharmacy | `POST` | `{{baseUrl}}/api/v1/pharmacies` |
| B3 | List warehouses | `GET` | `{{baseUrl}}/api/v1/warehouses` |
| B4 | List pharmacies | `GET` | `{{baseUrl}}/api/v1/pharmacies` |

**B1 Create warehouse**
```json
{
  "name": "Central Warehouse",
  "code": "WH01",
  "address": "Industrial Zone",
  "phone": "+963900000000"
}
```
Save `data.id` → `warehouseId`

**B2 Create pharmacy**
```json
{
  "name": "Pharmacy A",
  "code": "PH01",
  "address": "Main Street",
  "phone": "+963922222222",
  "primaryWarehouseId": "{{warehouseId}}"
}
```
Save `data.id` → `pharmacyId`

---

### Phase C — Catalog

| # | Request name | Method | URL |
|---|---|---|---|
| C1 | Create category | `POST` | `{{baseUrl}}/api/v1/categories` |
| C2 | Create manufacturer | `POST` | `{{baseUrl}}/api/v1/manufacturers` |
| C3 | Create active ingredient | `POST` | `{{baseUrl}}/api/v1/active-ingredients` |
| C4 | Create drug | `POST` | `{{baseUrl}}/api/v1/drugs` |
| C5 | List drugs | `GET` | `{{baseUrl}}/api/v1/drugs` |
| C6 | Alternatives by ingredient | `GET` | `{{baseUrl}}/api/v1/drugs/by-active-ingredient/{{ingredientId}}?page=1&limit=20` |

**C1**
```json
{
  "name": "Pain Relief",
  "description": "Analgesics and antipyretics"
}
```
Save → `categoryId`

**C2**
```json
{
  "name": "GSK",
  "country": "UK"
}
```
Save → `manufacturerId`

**C3**
```json
{
  "name": "Paracetamol"
}
```
Save → `ingredientId`

**C4**
```json
{
  "name": "Panadol 500mg",
  "activeIngredientIds": ["{{ingredientId}}"],
  "categoryId": "{{categoryId}}",
  "manufacturerId": "{{manufacturerId}}",
  "dosageForm": "Tablet",
  "concentration": "500mg",
  "barcode": "6281000000001",
  "sellingPrice": 1500,
  "minimumStockThreshold": 10
}
```
Save → `drugId`

---

### Phase D — Purchasing (stock into warehouse)

| # | Request name | Method | URL |
|---|---|---|---|
| D1 | Create payment method | `POST` | `{{baseUrl}}/api/v1/payment-methods` |
| D2 | Register supplier | `POST` | `{{baseUrl}}/api/v1/suppliers` |
| D3 | Create purchase request (auto-approve) | `POST` | `{{baseUrl}}/api/v1/purchase-requests` |
| D4 | Receive purchase | `POST` | `{{baseUrl}}/api/v1/purchase-receipts` |
| D5 | Check warehouse inventory | `GET` | `{{baseUrl}}/api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}` |

**D1**
```json
{
  "name": "Cash",
  "code": "CASH"
}
```
Save → `paymentMethodId`

**D2**
```json
{
  "name": "MedSupply Co.",
  "code": "SUP01",
  "phone": "+963900000001",
  "email": "orders@medsupply.com",
  "address": "Industrial Zone"
}
```
Save → `supplierId`

**D3** (admin/manager with `unitCost` → auto creates purchase order)
```json
{
  "warehouseId": "{{warehouseId}}",
  "supplierId": "{{supplierId}}",
  "items": [
    {
      "drugId": "{{drugId}}",
      "requestedQuantity": 100,
      "unitCost": 1200
    }
  ]
}
```
Save `data.purchaseOrder.id` → `purchaseOrderId`

**D4**
```json
{
  "purchaseOrderId": "{{purchaseOrderId}}",
  "invoiceNumber": "INV-2026-0001",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchNumber": "BN2026-100",
      "expiryDate": "2027-12-31",
      "quantity": 100,
      "unitCost": 1200
    }
  ]
}
```
Save `data.receipt.items[0].batchId` → `batchId`

Expected: warehouse stock = 100.

---

### Phase E — Supply to pharmacy

| # | Request name | Method | URL |
|---|---|---|---|
| E1 | Request supply (pharmacy → warehouse) | `POST` | `{{baseUrl}}/api/v1/supply-requests/pharmacy` |
| E2 | Approve supply request | `POST` | `{{baseUrl}}/api/v1/supply-requests/{{supplyRequestId}}/approve` |
| E3 | Prepare shipment | `POST` | `{{baseUrl}}/api/v1/shipments` |
| E4 | Send shipment | `POST` | `{{baseUrl}}/api/v1/shipments/{{shipmentId}}/send` |
| E5 | Receive shipment | `POST` | `{{baseUrl}}/api/v1/shipments/{{shipmentId}}/receive` |
| E6 | Check pharmacy inventory | `GET` | `{{baseUrl}}/api/v1/inventory?locationType=pharmacy&locationId={{pharmacyId}}` |

**E1**
```json
{
  "pharmacyId": "{{pharmacyId}}",
  "items": [
    { "drugId": "{{drugId}}", "requestedQuantity": 50 }
  ]
}
```
Save → `supplyRequestId`

**E2**
```json
{
  "items": [
    {
      "drugId": "{{drugId}}",
      "approvedQuantity": 50,
      "itemReason": ""
    }
  ]
}
```

**E3**
```json
{
  "supplyRequestId": "{{supplyRequestId}}",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "sentQuantity": 50
    }
  ]
}
```
Save → `shipmentId`

**E4** — empty body

**E5**
```json
{
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "receivedQuantity": 50
    }
  ]
}
```

Expected: pharmacy stock = 50, warehouse stock = 50.

---

### Phase F — Sales

| # | Request name | Method | URL |
|---|---|---|---|
| F1 | Create sales invoice (FEFO) | `POST` | `{{baseUrl}}/api/v1/sales-invoices` |
| F2 | List sales invoices | `GET` | `{{baseUrl}}/api/v1/sales-invoices` |
| F3 | Get sales invoice | `GET` | `{{baseUrl}}/api/v1/sales-invoices/{{salesInvoiceId}}` |
| F4 | Check pharmacy inventory after sale | `GET` | `{{baseUrl}}/api/v1/inventory?locationType=pharmacy&locationId={{pharmacyId}}` |

**F1**
```json
{
  "pharmacyId": "{{pharmacyId}}",
  "paymentMethodId": "{{paymentMethodId}}",
  "customer": {
    "name": "Ahmad Ali",
    "nationalId": ""
  },
  "items": [
    {
      "drugId": "{{drugId}}",
      "quantity": 2
    }
  ]
}
```
Save → `salesInvoiceId`

Optional discount (manager/admin only):
```json
{
  "pharmacyId": "{{pharmacyId}}",
  "paymentMethodId": "{{paymentMethodId}}",
  "items": [
    {
      "drugId": "{{drugId}}",
      "quantity": 2,
      "discountType": "PERCENTAGE",
      "discountValue": 10
    }
  ]
}
```

Expected: pharmacy stock decreased by 2.

---

### Phase G — Returns / destruction / adjustment

| # | Request name | Method | URL |
|---|---|---|---|
| G1 | Create customer return | `POST` | `{{baseUrl}}/api/v1/customer-returns` |
| G2 | Create pharmacy return | `POST` | `{{baseUrl}}/api/v1/pharmacy-returns` |
| G3 | Send pharmacy return | `POST` | `{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}/send` |
| G4 | Receive pharmacy return | `POST` | `{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}/receive` |
| G5 | Create supplier return | `POST` | `{{baseUrl}}/api/v1/supplier-returns` |
| G6 | Record destruction | `POST` | `{{baseUrl}}/api/v1/destructions` |
| G7 | Create inventory adjustment | `POST` | `{{baseUrl}}/api/v1/inventory-adjustments` |

**G1** (use drugId + batchId from the sales invoice items)
```json
{
  "salesInvoiceId": "{{salesInvoiceId}}",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "quantity": 1
    }
  ]
}
```

**G2**
```json
{
  "pharmacyId": "{{pharmacyId}}",
  "reason": "Near expiry overstock",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "sentQuantity": 5
    }
  ]
}
```
Save → `pharmacyReturnId`

**G3** — empty body

**G4**
```json
{
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "receivedQuantity": 5
    }
  ]
}
```

**G5**
```json
{
  "warehouseId": "{{warehouseId}}",
  "supplierId": "{{supplierId}}",
  "reason": "Damaged on arrival",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "quantity": 5
    }
  ]
}
```

**G6**
```json
{
  "locationType": "warehouse",
  "locationId": "{{warehouseId}}",
  "reason": "Expired and unsellable",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "quantity": 1
    }
  ]
}
```

**G7**
```json
{
  "locationType": "pharmacy",
  "locationId": "{{pharmacyId}}",
  "reason": "Physical count correction",
  "items": [
    {
      "drugId": "{{drugId}}",
      "batchId": "{{batchId}}",
      "quantity": 1,
      "direction": "in"
    }
  ]
}
```

---

### Phase H — Pricing, notifications, audit, reports

| # | Request name | Method | URL |
|---|---|---|---|
| H1 | Update selling price | `PATCH` | `{{baseUrl}}/api/v1/drugs/{{drugId}}/selling-price` |
| H2 | List price history | `GET` | `{{baseUrl}}/api/v1/drugs/{{drugId}}/price-history` |
| H3 | Run alert scan | `POST` | `{{baseUrl}}/api/v1/notifications/run-alerts` |
| H4 | List notifications | `GET` | `{{baseUrl}}/api/v1/notifications?status=UNREAD` |
| H5 | List audit logs | `GET` | `{{baseUrl}}/api/v1/audit-logs` |
| H5b | Export audit logs to Excel | `GET` | `{{baseUrl}}/api/v1/audit-logs/export` |
| H6 | Sales report | `GET` | `{{baseUrl}}/api/v1/reports/sales` |
| H7 | Inventory report | `GET` | `{{baseUrl}}/api/v1/reports/inventory?locationType=pharmacy&locationId={{pharmacyId}}` |
| H8 | Near-expiry report | `GET` | `{{baseUrl}}/api/v1/reports/near-expiry?days=30` |
| H9 | Best-selling drugs | `GET` | `{{baseUrl}}/api/v1/reports/best-selling-drugs?limit=10` |
| H10 | Logout | `POST` | `{{baseUrl}}/api/v1/auth/logout` |

**H1**
```json
{
  "sellingPrice": 1800
}
```

**H3 / H10** — empty body

**H5b** — returns an Excel file (not JSON). In Postman: **Send and Download**. Same filters as list (`action`, `userId`, `entityType`, `entityId`).

---

## FULL ENDPOINT REFERENCE

Use `{{baseUrl}}` + path below. Auth cookies required except Health and Login.

### Auth

| Request name | Method | Path | Body |
|---|---|---|---|
| Health check | `GET` | `/api/v1/health` | — |
| Login | `POST` | `/api/v1/auth/login` | `{ "email", "password" }` |
| Refresh | `POST` | `/api/v1/auth/refresh` | empty |
| Logout | `POST` | `/api/v1/auth/logout` | empty |
| Current user | `GET` | `/api/v1/auth/me` | — |

### Users

| Request name | Method | Path |
|---|---|---|
| List users | `GET` | `/api/v1/users?page=1&limit=20` |
| Create user | `POST` | `/api/v1/users` |
| Get user | `GET` | `/api/v1/users/:id` |
| Update user | `PATCH` | `/api/v1/users/:id` |
| Deactivate user | `POST` | `/api/v1/users/:id/deactivate` |

Create user example:
```json
{
  "firstName": "Sara",
  "lastName": "Hassan",
  "email": "sara.hassan@example.com",
  "password": "Password123",
  "role": "PHARMACY_MANAGER",
  "pharmacyIds": ["{{pharmacyId}}"],
  "warehouseIds": []
}
```

Roles: `SYSTEM_ADMIN`, `PHARMACY_ADMIN`, `PHARMACY_MANAGER`, `WAREHOUSE_MANAGER`, `PHARMACIST`, `PHARMACY_EMPLOYEE`, `WAREHOUSE_EMPLOYEE`

### Warehouses / Pharmacies

| Request name | Method | Path |
|---|---|---|
| List warehouses | `GET` | `/api/v1/warehouses` |
| Create warehouse | `POST` | `/api/v1/warehouses` |
| Get warehouse | `GET` | `/api/v1/warehouses/:id` |
| Update warehouse | `PATCH` | `/api/v1/warehouses/:id` |
| Deactivate warehouse | `POST` | `/api/v1/warehouses/:id/deactivate` |
| List pharmacies | `GET` | `/api/v1/pharmacies` |
| Create pharmacy | `POST` | `/api/v1/pharmacies` |
| Get pharmacy | `GET` | `/api/v1/pharmacies/:id` |
| Update pharmacy | `PATCH` | `/api/v1/pharmacies/:id` |
| Deactivate pharmacy | `POST` | `/api/v1/pharmacies/:id/deactivate` |

### Catalog

| Request name | Method | Path |
|---|---|---|
| Categories CRUD | `GET/POST/PATCH` + deactivate | `/api/v1/categories` |
| Manufacturers CRUD | `GET/POST/PATCH` + deactivate | `/api/v1/manufacturers` |
| Active ingredients CRUD | `GET/POST/PATCH` + deactivate | `/api/v1/active-ingredients` |
| Drugs CRUD | `GET/POST/PATCH` + deactivate | `/api/v1/drugs` |
| Alternatives | `GET` | `/api/v1/drugs/by-active-ingredient/:activeIngredientId?page=1&limit=20` |
| Update selling price | `PATCH` | `/api/v1/drugs/:id/selling-price` |
| Price history | `GET` | `/api/v1/drugs/:id/price-history` |
| Batches CRUD | `GET/POST/PATCH` + deactivate | `/api/v1/batches` |
| FEFO batches | `GET` | `/api/v1/batches/fefo/:drugId` |

Drug list filters: `?search=` `?categoryId=` `?activeIngredientId=`

Do **not** send `sellingPrice` on `PATCH /drugs/:id` — use `/selling-price`.

### Inventory (read-only)

| Request name | Method | Path |
|---|---|---|
| List inventory | `GET` | `/api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}` |
| Inventory summary | `GET` | `/api/v1/inventory/summary?locationType=warehouse&locationId={{warehouseId}}&drugId={{drugId}}` |
| Get inventory row | `GET` | `/api/v1/inventory/:id` |

`locationType` must be `warehouse` or `pharmacy`.

### Stock movements

| Request name | Method | Path |
|---|---|---|
| List movements | `GET` | `/api/v1/stock-movements?locationType=warehouse&locationId={{warehouseId}}` |
| Create movement | `POST` | `/api/v1/stock-movements` |
| Get movement | `GET` | `/api/v1/stock-movements/:id` |

Manual stock-in example (only for non-domain types like purchase/supply testing):
```json
{
  "movementType": "PURCHASE_RECEIVING",
  "direction": "in",
  "drugId": "{{drugId}}",
  "batchId": "{{batchId}}",
  "quantity": 10,
  "locationType": "warehouse",
  "locationId": "{{warehouseId}}",
  "reference": "manual-test"
}
```

**Blocked on this endpoint** (use dedicated modules instead):
`CUSTOMER_RETURN`, `RETURN_TO_WAREHOUSE`, `RETURN_FROM_PHARMACY`, `RETURN_TO_SUPPLIER`, `DESTRUCTION`, `INVENTORY_ADJUSTMENT`

### Supply requests

| Request name | Method | Path |
|---|---|---|
| List | `GET` | `/api/v1/supply-requests` |
| Get | `GET` | `/api/v1/supply-requests/:id` |
| Pharmacy → warehouse | `POST` | `/api/v1/supply-requests/pharmacy` |
| Warehouse → warehouse | `POST` | `/api/v1/supply-requests/warehouse` |
| Approve | `POST` | `/api/v1/supply-requests/:id/approve` |
| Reject | `POST` | `/api/v1/supply-requests/:id/reject` |
| Cancel | `POST` | `/api/v1/supply-requests/:id/cancel` |

Warehouse → warehouse body:
```json
{
  "sourceWarehouseId": "{{warehouseId}}",
  "destinationWarehouseId": "OTHER_WAREHOUSE_ID",
  "items": [
    { "drugId": "{{drugId}}", "requestedQuantity": 20 }
  ]
}
```

Reject body:
```json
{ "rejectionReason": "Out of stock at warehouse" }
```

Statuses: `PENDING_APPROVAL` → `APPROVED` | `REJECTED` | `CANCELLED`

### Shipments

| Request name | Method | Path |
|---|---|---|
| List | `GET` | `/api/v1/shipments` |
| Get | `GET` | `/api/v1/shipments/:id` |
| Prepare | `POST` | `/api/v1/shipments` |
| Send | `POST` | `/api/v1/shipments/:id/send` |
| Receive | `POST` | `/api/v1/shipments/:id/receive` |

Statuses: `PREPARED` → `SENT` → `PARTIALLY_RECEIVED` | `RECEIVED`

### Purchasing

| Request name | Method | Path |
|---|---|---|
| Suppliers CRUD + deactivate | | `/api/v1/suppliers` |
| List purchase requests | `GET` | `/api/v1/purchase-requests` |
| Create purchase request | `POST` | `/api/v1/purchase-requests` |
| Approve | `POST` | `/api/v1/purchase-requests/:id/approve` |
| Reject | `POST` | `/api/v1/purchase-requests/:id/reject` |
| Cancel | `POST` | `/api/v1/purchase-requests/:id/cancel` |
| List purchase orders | `GET` | `/api/v1/purchase-orders` |
| Get purchase order | `GET` | `/api/v1/purchase-orders/:id` |
| Receive purchase | `POST` | `/api/v1/purchase-receipts` |
| List receipts | `GET` | `/api/v1/purchase-receipts` |
| List invoices | `GET` | `/api/v1/purchase-invoices` |

Employee create (needs approve):
```json
{
  "warehouseId": "{{warehouseId}}",
  "supplierId": "{{supplierId}}",
  "items": [
    { "drugId": "{{drugId}}", "requestedQuantity": 100 }
  ]
}
```

Approve:
```json
{
  "items": [
    {
      "drugId": "{{drugId}}",
      "approvedQuantity": 100,
      "unitCost": 1200,
      "itemReason": ""
    }
  ]
}
```

PO statuses: `OPEN` → `PARTIALLY_RECEIVED` → `RECEIVED`

### Sales

| Request name | Method | Path |
|---|---|---|
| Payment methods CRUD + deactivate | | `/api/v1/payment-methods` |
| List sales invoices | `GET` | `/api/v1/sales-invoices` |
| Create sales invoice | `POST` | `/api/v1/sales-invoices` |
| Get sales invoice | `GET` | `/api/v1/sales-invoices/:id` |

Sales invoices are immutable after create.

### Returns / destruction / adjustments

| Request name | Method | Path |
|---|---|---|
| Customer returns list/create/get | | `/api/v1/customer-returns` |
| Pharmacy returns list/create/get/send/receive | | `/api/v1/pharmacy-returns` |
| Supplier returns list/create/get | | `/api/v1/supplier-returns` |
| Destructions list/create/get | | `/api/v1/destructions` |
| Inventory adjustments list/create/get | | `/api/v1/inventory-adjustments` |

### Notifications / audit / reports

| Request name | Method | Path |
|---|---|---|
| List notifications | `GET` | `/api/v1/notifications` |
| Unread count | `GET` | `/api/v1/notifications/unread-count` |
| Mark one read | `PATCH` | `/api/v1/notifications/:id/read` |
| Mark all read | `POST` | `/api/v1/notifications/mark-all-read` |
| Run alerts | `POST` | `/api/v1/notifications/run-alerts` |
| List audit logs | `GET` | `/api/v1/audit-logs` |
| Export audit logs to Excel | `GET` | `/api/v1/audit-logs/export` |
| Get audit log | `GET` | `/api/v1/audit-logs/:id` |
| Sales report | `GET` | `/api/v1/reports/sales` |
| Best-selling | `GET` | `/api/v1/reports/best-selling-drugs?limit=10` |
| Purchases report | `GET` | `/api/v1/reports/purchases` |
| Stock movements report | `GET` | `/api/v1/reports/stock-movements` |
| Inventory report | `GET` | `/api/v1/reports/inventory` |
| Near expiry | `GET` | `/api/v1/reports/near-expiry?days=30` |
| Expired | `GET` | `/api/v1/reports/expired` |

Report filters (when relevant): `from`, `to`, `pharmacyId`, `warehouseId`, `locationType`, `locationId`, `drugId`, `categoryId`, `supplierId`, `userId`

Notification types: `LOW_STOCK`, `NEAR_EXPIRY`, `EXPIRED`, `SUPPLY_REQUEST`, `SHIPMENT`, `PURCHASE_REQUEST`

### Audit logs (read + Excel export)

| Request name | Method | Path |
|---|---|---|
| List audit logs | `GET` | `/api/v1/audit-logs?page=1&limit=20` |
| Export audit logs to Excel | `GET` | `/api/v1/audit-logs/export` |
| Get audit log by ID | `GET` | `/api/v1/audit-logs/:id` |

Filters (list + export): `?action=auth.login` · `?userId=...` · `?entityType=SalesInvoice` · `?entityId=...`

- Permission: `audit-logs.read` (managers + system admin)
- Export returns a `.xlsx` file (`audit-logs-YYYY-MM-DD.xlsx`), not JSON — in Postman use **Send and Download**
- Export has no pagination: it downloads **every** matching log (up to 90-day TTL retention)
- Excel columns: Log ID, User ID, Action, Entity Type, Entity ID, Metadata, Created At
- Read-only; logs auto-delete after **90 days** (MongoDB TTL)

---

## COMMON ERRORS

| Code | Meaning | Fix |
|---|---|---|
| `UNAUTHENTICATED` | Not logged in / cookie missing | Login again; enable cookies |
| `FORBIDDEN` | Role or location scope blocked | Use admin or linked user |
| `VALIDATION_ERROR` | Bad body/query | Check required fields and 24-hex ids |
| `INSUFFICIENT_STOCK` | Not enough qty | Add stock first |
| `INVALID_DRUG` / `INVALID_BATCH` | Missing/inactive | Use live ids |
| `BATCH_DRUG_MISMATCH` | Batch ≠ drug | Match batch to drug |
| `ITEM_REASON_REQUIRED` | Reduced approve qty | Add `itemReason` |
| `EXCEEDS_ORDERED_QUANTITY` | Receive too much | Check remaining PO qty |
| `INVOICE_IN_USE` | Duplicate invoice number | Use a new number |
| `ITEM_NOT_ON_INVOICE` | Return item mismatch | Use exact sales invoice lines |
| `EXCEEDS_SOLD_QUANTITY` | Return too much | Check prior returns |
| `BATCH_NOT_FROM_WAREHOUSE` | Pharmacy return invalid | Only return supply-received stock |
| `BATCH_NOT_FROM_SUPPLIER` | Supplier return invalid | Use purchased batch |
| `USE_PRICE_ENDPOINT` | Wrong price update path | Use `/drugs/:id/selling-price` |
| `DISCOUNT_FORBIDDEN` | No discount permission | Remove discount or use manager |
| `RATE_LIMITED` | Too many requests | Wait and retry |

---

## INSTRUCTIONS FOR POSTMAN AI

Build a Postman collection from this file with:

1. Collection name: **Pharmacy Management System**
2. Variable `baseUrl` = `http://localhost:3000`
3. Folder order matching phases **A → H**
4. Request names exactly as listed in the MASTER flow tables
5. Bodies exactly as shown (with `{{variables}}`)
6. After each create response, document which `id` to save
7. Enable cookie jar / credentials
8. Include a README folder note with login:
   - email: `admin@example.com`
   - password: `Admin12345`
9. Do not invent endpoints not listed here
10. Prefer the MASTER END-TO-END TEST FLOW as the primary documentation path
