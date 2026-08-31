# API requests (Postman)

Base URL: `http://localhost:3000`

Postman: enable cookies. No Authorization headers.

After login, HttpOnly cookies:
- `accessToken` — path `/api/v1`
- `refreshToken` — path `/api/v1/auth`

Replace example ObjectIds with real `id` values from responses.

---

## Auth

### Login
`POST /api/v1/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "Admin12345"
}
```

### Refresh / Logout / Me
- `POST /api/v1/auth/refresh` (empty body)
- `POST /api/v1/auth/logout` (empty body)
- `GET /api/v1/auth/me`

---

## Users
`GET/POST /api/v1/users` · `GET/PATCH /api/v1/users/:id` · `POST /api/v1/users/:id/deactivate`

---

## Warehouses
`GET/POST /api/v1/warehouses` · `GET/PATCH /api/v1/warehouses/:id` · `POST /api/v1/warehouses/:id/deactivate`

Create example:
```json
{
  "name": "Central Warehouse",
  "code": "WH01",
  "address": "Industrial Zone",
  "phone": "+963900000000"
}
```

---

## Pharmacies
`GET/POST /api/v1/pharmacies` · `GET/PATCH /api/v1/pharmacies/:id` · `POST /api/v1/pharmacies/:id/deactivate`

Create example:
```json
{
  "name": "Pharmacy A",
  "code": "PH01",
  "address": "Main Street",
  "phone": "+963922222222",
  "primaryWarehouseId": "WAREHOUSE_ID_HERE"
}
```

---

## Catalog

Build in this order: category → manufacturer → active ingredient → drug.

### Categories
`GET/POST /api/v1/categories` · `GET/PATCH /api/v1/categories/:id` · `POST /api/v1/categories/:id/deactivate`

List: `GET /api/v1/categories?search=pain`

Create:
```json
{
  "name": "Pain Relief",
  "description": "Analgesics and antipyretics"
}
```

### Manufacturers
`GET/POST /api/v1/manufacturers` · `GET/PATCH /api/v1/manufacturers/:id` · `POST /api/v1/manufacturers/:id/deactivate`

Create:
```json
{
  "name": "GSK",
  "country": "UK"
}
```

### Active ingredients
`GET/POST /api/v1/active-ingredients` · `GET/PATCH /api/v1/active-ingredients/:id` · `POST /api/v1/active-ingredients/:id/deactivate`

Create:
```json
{
  "name": "Paracetamol"
}
```

### Drugs
`GET/POST /api/v1/drugs` · `GET/PATCH /api/v1/drugs/:id` · `POST /api/v1/drugs/:id/deactivate`

List filters:
- `?search=panadol`
- `?categoryId=CATEGORY_ID`
- `?activeIngredientId=INGREDIENT_ID`

Alternative search (SRS):
`GET /api/v1/drugs/by-active-ingredient/INGREDIENT_ID`

Create:
```json
{
  "name": "Panadol 500mg",
  "activeIngredientIds": ["INGREDIENT_ID"],
  "categoryId": "CATEGORY_ID",
  "manufacturerId": "MANUFACTURER_ID",
  "dosageForm": "Tablet",
  "concentration": "500mg",
  "barcode": "6281000000001",
  "sellingPrice": 1500,
  "minimumStockThreshold": 10
}
```

Reactivate any catalog item with `"isActive": true` on PATCH.

Permissions:
- create / deactivate: System Admin, Pharmacy Admin
- read: managers, pharmacists (drugs + ingredients), employees (drugs read)
- update: System Admin, Pharmacy Admin

### Batches
`GET/POST /api/v1/batches` · `GET/PATCH /api/v1/batches/:id` · `POST /api/v1/batches/:id/deactivate`

FEFO list (active batches for one drug, earliest expiry first):
`GET /api/v1/batches/fefo/DRUG_ID`

List filters:
- `?drugId=DRUG_ID` (sorts by expiry when set)
- `?search=BN2026`

Create:
```json
{
  "drugId": "DRUG_ID",
  "batchNumber": "BN2026-001",
  "expiryDate": "2027-06-30",
  "source": "Supplier ABC",
  "receiptReference": "PR-1001"
}
```

Notes:
- `drugId`, `batchNumber`, and `expiryDate` are set on create only (corrections come later).
- Quantity is **not** on the batch — it lives in **inventory** (next module).
- Expired batches are allowed.
- `batchNumber` is stored uppercase; unique per drug.

Permissions:
- create / deactivate: System Admin, Pharmacy Admin
- create / update: Warehouse Manager (no deactivate)
- read: all operational roles (managers, pharmacists, employees)

---

## Inventory and stock

**Rule:** quantity lives on **inventory** (location + batch). You never PATCH inventory directly — use **stock movements** to add or remove stock.

### Quick reference

| What you want | Method | URL |
|---|---|---|
| See all stock at a warehouse | `GET` | `/api/v1/inventory?locationType=warehouse&locationId=WAREHOUSE_ID` |
| See all stock at a pharmacy | `GET` | `/api/v1/inventory?locationType=pharmacy&locationId=PHARMACY_ID` |
| See stock for one drug at a location | `GET` | `/api/v1/inventory?locationType=warehouse&locationId=WAREHOUSE_ID&drugId=DRUG_ID` |
| Total qty for one drug (all batches) | `GET` | `/api/v1/inventory/summary?locationType=warehouse&locationId=WAREHOUSE_ID&drugId=DRUG_ID` |
| Add stock | `POST` | `/api/v1/stock-movements` with `"direction": "in"` |
| Remove stock | `POST` | `/api/v1/stock-movements` with `"direction": "out"` |
| Movement history | `GET` | `/api/v1/stock-movements?locationType=warehouse&locationId=WAREHOUSE_ID` |

**`locationType` values:** only `warehouse` or `pharmacy` (lowercase).

### ID format (important)

Every `drugId`, `batchId`, `locationId` must be a **plain 24-character hex string** — no spaces, no quotes inside the value, **no curly braces**.

| Wrong | Right |
|---|---|
| `"{6a92a4ec9e26c4085e61f2a0}"` | `"6a92a4ec9e26c4085e61f2a0"` |
| `{6a92a4ec9e26c4085e61f2a0}` | `6a92a4ec9e26c4085e61f2a0` |

**Postman variables** use **double** braces: `"drugId": "{{drugId}}"` — Postman replaces that before sending.  
Do **not** wrap a real id in `{...}` yourself.

Copy the `id` field exactly from a previous API response (e.g. `"id": "6a92a4ec9e26c4085e61f2a0"` → use `6a92a4ec9e26c4085e61f2a0` in the body).

---

### Step-by-step (Postman)

Do this once to collect IDs, then reuse them:

1. `GET /api/v1/warehouses` → copy a warehouse `id`
2. `GET /api/v1/drugs` → copy a drug `id`
3. `POST /api/v1/batches` → create a batch, copy its `id`
4. Add stock (step 5 below)
5. Check inventory (step 6 below)

Keep these in Postman variables (optional but helpful):

| Variable | Example |
|---|---|
| `warehouseId` | from warehouses list |
| `pharmacyId` | from pharmacies list |
| `drugId` | from drugs list |
| `batchId` | from batch create response |

---

### 1) Add stock (warehouse receive)

`POST /api/v1/stock-movements`

```json
{
  "movementType": "PURCHASE_RECEIVING",
  "direction": "in",
  "drugId": "drugId",
  "batchId": "batchId",
  "quantity": 100,
  "locationType": "warehouse",
  "locationId": "warehouseId",
  "reference": "manual-test"
}
```

Replace the three ids above with **your** ids from GET/create responses. Or use Postman env vars: `"drugId": "{{drugId}}"`.

Response includes updated `inventory.quantity` and the new `movement`.

---

### 2) Check inventory at warehouse

**All batches at warehouse:**
```
GET /api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}
```

**One drug only:**
```
GET /api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}&drugId={{drugId}}
```

**One batch only:**
```
GET /api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}&batchId={{batchId}}
```

**Total for one drug (sum of all batches):**
```
GET /api/v1/inventory/summary?locationType=warehouse&locationId={{warehouseId}}&drugId={{drugId}}
```

Each list item includes readable names (not just ids):

| Field | Meaning |
|---|---|
| `locationName` | Warehouse or pharmacy name |
| `locationCode` | e.g. `WH01`, `PH01` |
| `drugName` | Drug display name |
| `batchNumber` | Lot number |
| `expiryDate` | Batch expiry |
| `quantity` | Current stock for that batch at that location |

Example list response:
```json
{
  "success": true,
  "message": "Inventory retrieved.",
  "data": {
    "items": [
      {
        "id": "6a94a1b2c3d4e5f6a7b8c9d0",
        "locationType": "warehouse",
        "locationId": "6a90210972bc6757c2cfc483",
        "locationName": "Central Warehouse",
        "locationCode": "WH01",
        "drugId": "6a92a4ec9e26c4085e61f2a0",
        "drugName": "Panadol 500mg",
        "batchId": "6a93f6a551a2dca6b1245093",
        "batchNumber": "BN2026-001",
        "expiryDate": "2027-06-30T00:00:00.000Z",
        "quantity": 100,
        "createdAt": "2026-08-30T10:00:00.000Z",
        "updatedAt": "2026-08-30T10:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Example summary response:
```json
{
  "success": true,
  "message": "Inventory summary retrieved.",
  "data": {
    "locationType": "warehouse",
    "locationId": "6a90210972bc6757c2cfc483",
    "locationName": "Central Warehouse",
    "locationCode": "WH01",
    "drugId": "6a92a4ec9e26c4085e61f2a0",
    "drugName": "Panadol 500mg",
    "totalQuantity": 100
  }
}
```

---

### 3) Remove stock (warehouse out)

`POST /api/v1/stock-movements`

```json
{
  "movementType": "SUPPLY_TO_PHARMACY",
  "direction": "out",
  "drugId": "{{drugId}}",
  "batchId": "{{batchId}}",
  "quantity": 10,
  "locationType": "warehouse",
  "locationId": "{{warehouseId}}"
}
```

If qty is too high → `400` with code `INSUFFICIENT_STOCK`.

---

### 4) Add stock at pharmacy (receive)

Same as warehouse — change `locationType` and `locationId`:

```json
{
  "movementType": "SUPPLY_RECEIVING",
  "direction": "in",
  "drugId": "{{drugId}}",
  "batchId": "{{batchId}}",
  "quantity": 10,
  "locationType": "pharmacy",
  "locationId": "{{pharmacyId}}"
}
```

Check pharmacy stock:
```
GET /api/v1/inventory?locationType=pharmacy&locationId={{pharmacyId}}
```

---

### 5) Inventory adjustment (reason required)

Use when correcting qty (damaged, count mismatch, etc.):

`POST /api/v1/stock-movements`

```json
{
  "movementType": "INVENTORY_ADJUSTMENT",
  "direction": "out",
  "drugId": "{{drugId}}",
  "batchId": "{{batchId}}",
  "quantity": 3,
  "locationType": "warehouse",
  "locationId": "{{warehouseId}}",
  "reason": "Damaged items"
}
```

For `"direction": "in"` adjustment, same body but positive add instead of remove.

---

### 6) Movement history

**Where to get `MOVEMENT_ID`:**

| Source | Where the id is |
|---|---|
| After you add/remove stock | `POST /api/v1/stock-movements` → response `data.movement.id` |
| Movement list | `GET /api/v1/stock-movements` → each item in `data.items[].id` |

Example after `POST /api/v1/stock-movements`:
```json
{
  "success": true,
  "message": "Stock movement recorded.",
  "data": {
    "movement": {
      "id": "6a9550aa11bb22cc33dd44ee",
      "movementType": "PURCHASE_RECEIVING",
      "direction": "in",
      "quantity": 100,
      "...": "..."
    },
    "inventory": {
      "id": "...",
      "quantity": 100,
      "...": "..."
    }
  }
}
```
Copy `data.movement.id` → use it as `MOVEMENT_ID`.

Example list item (`GET /api/v1/stock-movements?...`):
```json
{
  "items": [
    {
      "id": "6a9550aa11bb22cc33dd44ee",
      "movementType": "PURCHASE_RECEIVING",
      "direction": "in",
      "quantity": 100
    }
  ]
}
```

**At one location:**
```
GET /api/v1/stock-movements?locationType=warehouse&locationId={{warehouseId}}
```

**Filter by drug:**
```
GET /api/v1/stock-movements?locationType=warehouse&locationId={{warehouseId}}&drugId={{drugId}}
```

**Single movement (use id from create or list):**
```
GET /api/v1/stock-movements/6a9550aa11bb22cc33dd44ee
```

---

### Movement types (copy-paste)

| Type | Usually used at | Direction |
|---|---|---|
| `PURCHASE_RECEIVING` | warehouse | `in` |
| `SUPPLY_TO_PHARMACY` | warehouse | `out` |
| `SUPPLY_TO_WAREHOUSE` | warehouse | `in` or `out` |
| `SUPPLY_RECEIVING` | pharmacy | `in` |
| `SALE` | pharmacy | `out` |
| `CUSTOMER_RETURN` | pharmacy | `in` |
| `RETURN_TO_WAREHOUSE` | pharmacy | `out` |
| `RETURN_FROM_PHARMACY` | warehouse | `in` |
| `RETURN_TO_SUPPLIER` | warehouse | `out` |
| `DESTRUCTION` | warehouse or pharmacy | `out` |
| `INVENTORY_ADJUSTMENT` | warehouse or pharmacy | `in` or `out` (+ `reason`) |

---

### Common errors

| Code | Meaning | Fix |
|---|---|---|
| `INSUFFICIENT_STOCK` | Not enough qty for `out` | Check inventory first, lower `quantity` |
| `INVALID_DRUG` / `INVALID_BATCH` | Bad or inactive id | Use ids from live GET/create responses |
| `BATCH_DRUG_MISMATCH` | Batch belongs to another drug | Match `batchId` to `drugId` |
| `FORBIDDEN` | No access to that location | User must be linked to that pharmacy/warehouse |
| `VALIDATION_ERROR` | Missing fields or bad id format | ids must be 24 hex chars — no `{...}` around them |

---

### Permissions

- **Read** inventory + movements: all operational roles
- **Create** movements: System Admin, Pharmacy Admin, Pharmacy Manager, Warehouse Manager

---

## Supply requests and shipments

**Workflow:** request → approve → create shipment → send (stock out) → receive (stock in)

Approval does **not** change inventory. Stock moves only on **send** and **receive**.

### Supply requests

Use these names in Postman (folder: **Supply Requests**):

| Postman request name | Method | URL |
|---|---|---|
| List supply requests | `GET` | `/api/v1/supply-requests` |
| Get supply request by ID | `GET` | `/api/v1/supply-requests/REQUEST_ID` |
| Request supply — pharmacy to warehouse | `POST` | `/api/v1/supply-requests/pharmacy` |
| Request supply — warehouse to warehouse | `POST` | `/api/v1/supply-requests/warehouse` |
| Approve supply request | `POST` | `/api/v1/supply-requests/REQUEST_ID/approve` |
| Reject supply request | `POST` | `/api/v1/supply-requests/REQUEST_ID/reject` |
| Cancel supply request | `POST` | `/api/v1/supply-requests/REQUEST_ID/cancel` |

List filters: `?status=APPROVED` · `?requestType=PHARMACY_TO_WAREHOUSE`

---

**Request supply — pharmacy to warehouse**  
Pharmacy asks its primary warehouse for stock.

`POST /api/v1/supply-requests/pharmacy`

```json
{
  "pharmacyId": "PHARMACY_ID",
  "items": [
    { "drugId": "DRUG_ID", "requestedQuantity": 50 }
  ]
}
```

---

**Request supply — warehouse to warehouse**  
One warehouse asks another warehouse for stock.

`POST /api/v1/supply-requests/warehouse`

```json
{
  "sourceWarehouseId": "SOURCE_WAREHOUSE_ID",
  "destinationWarehouseId": "DEST_WAREHOUSE_ID",
  "items": [
    { "drugId": "DRUG_ID", "requestedQuantity": 100 }
  ]
}
```

---

**Approve supply request**  
Warehouse/source manager sets approved qty per drug. Inventory is **not** changed yet.

`POST /api/v1/supply-requests/REQUEST_ID/approve`

```json
{
  "items": [
    {
      "drugId": "DRUG_ID",
      "approvedQuantity": 50,
      "itemReason": ""
    }
  ]
}
```

Use `itemReason` when `approvedQuantity` is reduced or set to `0`.

---

**Reject supply request**

`POST /api/v1/supply-requests/REQUEST_ID/reject`

```json
{
  "rejectionReason": "Out of stock at warehouse"
}
```

---

**Cancel supply request**  
Only while status is `PENDING_APPROVAL`.

`POST /api/v1/supply-requests/REQUEST_ID/cancel`

Statuses: `PENDING_APPROVAL` → `APPROVED` | `REJECTED` | `CANCELLED`

---

### Shipments

Use these names in Postman (folder: **Shipments**):

| Postman request name | Method | URL |
|---|---|---|
| List shipments | `GET` | `/api/v1/shipments` |
| Get shipment by ID | `GET` | `/api/v1/shipments/SHIPMENT_ID` |
| Prepare shipment | `POST` | `/api/v1/shipments` |
| Send shipment | `POST` | `/api/v1/shipments/SHIPMENT_ID/send` |
| Receive shipment | `POST` | `/api/v1/shipments/SHIPMENT_ID/receive` |

List filters: `?supplyRequestId=REQUEST_ID` · `?status=SENT`

---

**Prepare shipment**  
From an approved supply request. Assign batches and sent quantities at source.

`POST /api/v1/shipments`

```json
{
  "supplyRequestId": "SUPPLY_REQUEST_ID",
  "items": [
    {
      "drugId": "DRUG_ID",
      "batchId": "BATCH_ID",
      "sentQuantity": 50
    }
  ]
}
```

---

**Send shipment**  
Dispatches goods. Stock **out** at source (warehouse must have enough qty).

`POST /api/v1/shipments/SHIPMENT_ID/send`

---

**Receive shipment**  
Confirms arrival. Stock **in** at destination. Received qty can be less than sent.

`POST /api/v1/shipments/SHIPMENT_ID/receive`

```json
{
  "items": [
    {
      "drugId": "DRUG_ID",
      "batchId": "BATCH_ID",
      "receivedQuantity": 45
    }
  ]
}
```

Shortage is recorded automatically (`sentQuantity - receivedQuantity`).

Shipment statuses: `PREPARED` → `SENT` → `PARTIALLY_RECEIVED` | `RECEIVED`

---

### Full test flow (Postman)

| Step | Postman request name |
|---|---|
| 1 | Add stock at warehouse (`POST /stock-movements` — direction `in`) |
| 2 | **Request supply — pharmacy to warehouse** |
| 3 | **Approve supply request** |
| 4 | **Prepare shipment** |
| 5 | **Send shipment** → check warehouse inventory down |
| 6 | **Receive shipment** → check pharmacy inventory up |

List filters:
- `GET /api/v1/supply-requests?status=APPROVED`
- `GET /api/v1/shipments?supplyRequestId=REQUEST_ID`

Permissions:
- create/cancel requests: pharmacy & warehouse employees/managers
- approve/reject: managers + pharmacy admin
- create/send shipments: warehouse side
- receive shipments: destination side (pharmacy or warehouse)
