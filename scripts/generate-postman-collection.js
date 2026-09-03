import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonHdr = [{ key: "Content-Type", value: "application/json" }];

function saveScript(lines) {
  return {
    listen: "test",
    script: { type: "text/javascript", exec: lines },
  };
}

function saveId(varName) {
  return saveScript([
    "const j = pm.response.json();",
    `if (j?.data?.id) pm.collectionVariables.set('${varName}', j.data.id);`,
  ]);
}

function req(name, method, url, { body, description, events } = {}) {
  const r = {
    name,
    request: {
      method,
      header: body ? jsonHdr : [],
      url,
      description: description || "",
    },
  };
  if (body) {
    r.request.body = {
      mode: "raw",
      options: { raw: { language: "json" } },
      raw: typeof body === "string" ? body : JSON.stringify(body, null, 2),
    };
  }
  if (events) r.event = events;
  return r;
}

function folder(name, items, description = "") {
  return { name, description, item: items };
}

const master = folder(
  "00 — Master E2E Flow (run in order)",
  [
    folder("A — Auth & Health", [
      req("A1 — Health Check", "GET", "{{baseUrl}}/api/v1/health"),
      req("A2 — Login as Admin", "POST", "{{baseUrl}}/api/v1/auth/login", {
        body: { email: "admin@example.com", password: "Admin12345" },
        description: "Sets HttpOnly cookies. Dev: admin@example.com / Admin12345",
      }),
      req("A3 — Get Current User", "GET", "{{baseUrl}}/api/v1/auth/me"),
      req("A4 — Refresh Access Token", "POST", "{{baseUrl}}/api/v1/auth/refresh"),
    ]),
    folder("B — Locations", [
      req("B1 — Create Warehouse", "POST", "{{baseUrl}}/api/v1/warehouses", {
        body: {
          name: "Central Warehouse",
          code: "WH01",
          address: "Industrial Zone",
          phone: "+963900000000",
        },
        events: [saveId("warehouseId")],
      }),
      req("B2 — Create Pharmacy", "POST", "{{baseUrl}}/api/v1/pharmacies", {
        body: {
          name: "Pharmacy A",
          code: "PH01",
          address: "Main Street",
          phone: "+963922222222",
          primaryWarehouseId: "{{warehouseId}}",
        },
        events: [saveId("pharmacyId")],
      }),
      req("B3 — List Warehouses", "GET", "{{baseUrl}}/api/v1/warehouses"),
      req("B4 — List Pharmacies", "GET", "{{baseUrl}}/api/v1/pharmacies"),
    ]),
    folder("C — Catalog", [
      req("C1 — Create Category", "POST", "{{baseUrl}}/api/v1/categories", {
        body: { name: "Pain Relief", description: "Analgesics and antipyretics" },
        events: [saveId("categoryId")],
      }),
      req("C2 — Create Manufacturer", "POST", "{{baseUrl}}/api/v1/manufacturers", {
        body: { name: "GSK", country: "UK" },
        events: [saveId("manufacturerId")],
      }),
      req("C3 — Create Active Ingredient", "POST", "{{baseUrl}}/api/v1/active-ingredients", {
        body: { name: "Paracetamol" },
        events: [saveId("ingredientId")],
      }),
      req("C4 — Create Drug", "POST", "{{baseUrl}}/api/v1/drugs", {
        body: {
          name: "Panadol 500mg",
          activeIngredientIds: ["{{ingredientId}}"],
          categoryId: "{{categoryId}}",
          manufacturerId: "{{manufacturerId}}",
          dosageForm: "Tablet",
          concentration: "500mg",
          barcode: "6281000000001",
          sellingPrice: 1500,
          minimumStockThreshold: 10,
        },
        events: [saveId("drugId")],
      }),
      req("C5 — List Drugs", "GET", "{{baseUrl}}/api/v1/drugs"),
      req(
        "C6 — List Drug Alternatives by Ingredient",
        "GET",
        "{{baseUrl}}/api/v1/drugs/by-active-ingredient/{{ingredientId}}?page=1&limit=20"
      ),
    ]),
    folder("D — Purchasing", [
      req("D1 — Create Payment Method", "POST", "{{baseUrl}}/api/v1/payment-methods", {
        body: { name: "Cash", code: "CASH" },
        events: [saveId("paymentMethodId")],
      }),
      req("D2 — Create Supplier", "POST", "{{baseUrl}}/api/v1/suppliers", {
        body: {
          name: "MedSupply Co.",
          code: "SUP01",
          phone: "+963900000001",
          email: "orders@medsupply.com",
          address: "Industrial Zone",
        },
        events: [saveId("supplierId")],
      }),
      req(
        "D3 — Create Purchase Request (Auto-Approve PO)",
        "POST",
        "{{baseUrl}}/api/v1/purchase-requests",
        {
          body: {
            warehouseId: "{{warehouseId}}",
            supplierId: "{{supplierId}}",
            items: [{ drugId: "{{drugId}}", requestedQuantity: 100, unitCost: 1200 }],
          },
          events: [
            saveScript([
              "const j = pm.response.json();",
              "const d = j?.data;",
              "if (d?.request?.id) pm.collectionVariables.set('purchaseRequestId', d.request.id);",
              "else if (d?.id) pm.collectionVariables.set('purchaseRequestId', d.id);",
              "if (d?.purchaseOrder?.id) pm.collectionVariables.set('purchaseOrderId', d.purchaseOrder.id);",
            ]),
          ],
        }
      ),
      req(
        "D4 — Receive Purchase (Stock In Warehouse)",
        "POST",
        "{{baseUrl}}/api/v1/purchase-receipts",
        {
          body: {
            purchaseOrderId: "{{purchaseOrderId}}",
            invoiceNumber: "INV-2026-0001",
            items: [
              {
                drugId: "{{drugId}}",
                batchNumber: "BN2026-100",
                expiryDate: "2027-12-31",
                quantity: 100,
                unitCost: 1200,
              },
            ],
          },
          events: [
            saveScript([
              "const j = pm.response.json();",
              "const batchId = j?.data?.receipt?.items?.[0]?.batchId;",
              "if (batchId) pm.collectionVariables.set('batchId', batchId);",
            ]),
          ],
        }
      ),
      req(
        "D5 — List Warehouse Inventory",
        "GET",
        "{{baseUrl}}/api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}"
      ),
    ]),
    folder("E — Supply to Pharmacy", [
      req(
        "E1 — Create Pharmacy Supply Request",
        "POST",
        "{{baseUrl}}/api/v1/supply-requests/pharmacy",
        {
          body: {
            pharmacyId: "{{pharmacyId}}",
            items: [{ drugId: "{{drugId}}", requestedQuantity: 50 }],
          },
          events: [saveId("supplyRequestId")],
        }
      ),
      req(
        "E2 — Approve Supply Request",
        "POST",
        "{{baseUrl}}/api/v1/supply-requests/{{supplyRequestId}}/approve",
        {
          body: {
            items: [{ drugId: "{{drugId}}", approvedQuantity: 50, itemReason: "" }],
          },
        }
      ),
      req("E3 — Prepare Shipment", "POST", "{{baseUrl}}/api/v1/shipments", {
        body: {
          supplyRequestId: "{{supplyRequestId}}",
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", sentQuantity: 50 }],
        },
        events: [saveId("shipmentId")],
      }),
      req("E4 — Send Shipment", "POST", "{{baseUrl}}/api/v1/shipments/{{shipmentId}}/send"),
      req("E5 — Receive Shipment", "POST", "{{baseUrl}}/api/v1/shipments/{{shipmentId}}/receive", {
        body: {
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", receivedQuantity: 50 }],
        },
      }),
      req(
        "E6 — List Pharmacy Inventory",
        "GET",
        "{{baseUrl}}/api/v1/inventory?locationType=pharmacy&locationId={{pharmacyId}}"
      ),
    ]),
    folder("F — Sales", [
      req("F1 — Create Sales Invoice (FEFO)", "POST", "{{baseUrl}}/api/v1/sales-invoices", {
        body: {
          pharmacyId: "{{pharmacyId}}",
          paymentMethodId: "{{paymentMethodId}}",
          customer: { name: "Ahmad Ali", nationalId: "" },
          items: [{ drugId: "{{drugId}}", quantity: 2 }],
        },
        events: [
          saveScript([
            "const j = pm.response.json();",
            "if (j?.data?.id) pm.collectionVariables.set('salesInvoiceId', j.data.id);",
            "const bid = j?.data?.items?.[0]?.batchId;",
            "if (bid) pm.collectionVariables.set('batchId', bid);",
          ]),
        ],
      }),
      req("F2 — List Sales Invoices", "GET", "{{baseUrl}}/api/v1/sales-invoices"),
      req(
        "F3 — Get Sales Invoice by ID",
        "GET",
        "{{baseUrl}}/api/v1/sales-invoices/{{salesInvoiceId}}"
      ),
      req(
        "F4 — List Pharmacy Inventory After Sale",
        "GET",
        "{{baseUrl}}/api/v1/inventory?locationType=pharmacy&locationId={{pharmacyId}}"
      ),
      req(
        "F5 — Update Drug Selling Price",
        "PATCH",
        "{{baseUrl}}/api/v1/drugs/{{drugId}}/selling-price",
        { body: { sellingPrice: 1800 } }
      ),
      req(
        "F6 — List Drug Price History",
        "GET",
        "{{baseUrl}}/api/v1/drugs/{{drugId}}/price-history"
      ),
    ]),
    folder("G — Returns / Destruction / Adjustments", [
      req("G1 — Create Customer Return", "POST", "{{baseUrl}}/api/v1/customer-returns", {
        body: {
          salesInvoiceId: "{{salesInvoiceId}}",
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
        },
        events: [saveId("customerReturnId")],
      }),
      req("G2 — Create Pharmacy Return", "POST", "{{baseUrl}}/api/v1/pharmacy-returns", {
        body: {
          pharmacyId: "{{pharmacyId}}",
          reason: "Near expiry overstock",
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", sentQuantity: 5 }],
        },
        events: [saveId("pharmacyReturnId")],
      }),
      req(
        "G3 — Send Pharmacy Return",
        "POST",
        "{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}/send"
      ),
      req(
        "G4 — Receive Pharmacy Return",
        "POST",
        "{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}/receive",
        {
          body: {
            items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", receivedQuantity: 5 }],
          },
        }
      ),
      req("G5 — Create Supplier Return", "POST", "{{baseUrl}}/api/v1/supplier-returns", {
        body: {
          warehouseId: "{{warehouseId}}",
          supplierId: "{{supplierId}}",
          reason: "Damaged on arrival",
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 5 }],
        },
        events: [saveId("supplierReturnId")],
      }),
      req("G6 — Record Destruction", "POST", "{{baseUrl}}/api/v1/destructions", {
        body: {
          locationType: "warehouse",
          locationId: "{{warehouseId}}",
          reason: "Expired and unsellable",
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
        },
        events: [saveId("destructionId")],
      }),
      req(
        "G7 — Create Inventory Adjustment",
        "POST",
        "{{baseUrl}}/api/v1/inventory-adjustments",
        {
          body: {
            locationType: "pharmacy",
            locationId: "{{pharmacyId}}",
            reason: "Physical count correction",
            items: [
              {
                drugId: "{{drugId}}",
                batchId: "{{batchId}}",
                quantity: 1,
                direction: "in",
              },
            ],
          },
          events: [saveId("inventoryAdjustmentId")],
        }
      ),
    ]),
    folder("H — Notifications / Audit / Reports", [
      req("H1 — Run Alert Scan", "POST", "{{baseUrl}}/api/v1/notifications/run-alerts"),
      req(
        "H2 — List Unread Notifications",
        "GET",
        "{{baseUrl}}/api/v1/notifications?status=UNREAD"
      ),
      req("H3 — List Audit Logs", "GET", "{{baseUrl}}/api/v1/audit-logs"),
      req("H4 — Report: Sales", "GET", "{{baseUrl}}/api/v1/reports/sales"),
      req(
        "H5 — Report: Inventory",
        "GET",
        "{{baseUrl}}/api/v1/reports/inventory?locationType=pharmacy&locationId={{pharmacyId}}"
      ),
      req(
        "H6 — Report: Near Expiry",
        "GET",
        "{{baseUrl}}/api/v1/reports/near-expiry?days=30"
      ),
      req(
        "H7 — Report: Best-Selling Drugs",
        "GET",
        "{{baseUrl}}/api/v1/reports/best-selling-drugs?limit=10"
      ),
      req("H8 — Report: Purchases", "GET", "{{baseUrl}}/api/v1/reports/purchases"),
      req("H9 — Report: Expired", "GET", "{{baseUrl}}/api/v1/reports/expired"),
      req(
        "H10 — Report: Stock Movements",
        "GET",
        "{{baseUrl}}/api/v1/reports/stock-movements"
      ),
      req("H11 — Logout", "POST", "{{baseUrl}}/api/v1/auth/logout"),
    ]),
  ],
  "Run top to bottom. Cookies required after A2. IDs auto-saved into collection variables."
);

const full = [
  master,
  folder("01 — Auth & Health", [
    req("Health Check", "GET", "{{baseUrl}}/api/v1/health"),
    req("Login", "POST", "{{baseUrl}}/api/v1/auth/login", {
      body: { email: "admin@example.com", password: "Admin12345" },
    }),
    req("Refresh Token", "POST", "{{baseUrl}}/api/v1/auth/refresh"),
    req("Get Current User (Me)", "GET", "{{baseUrl}}/api/v1/auth/me"),
    req("Logout", "POST", "{{baseUrl}}/api/v1/auth/logout"),
  ]),
  folder("02 — Users", [
    req("List Users", "GET", "{{baseUrl}}/api/v1/users?page=1&limit=20"),
    req("Create User", "POST", "{{baseUrl}}/api/v1/users", {
      body: {
        firstName: "Sara",
        lastName: "Hassan",
        email: "sara.hassan@example.com",
        password: "Password123",
        role: "PHARMACY_MANAGER",
        pharmacyIds: ["{{pharmacyId}}"],
        warehouseIds: [],
      },
      events: [saveId("userId")],
    }),
    req("Get User by ID", "GET", "{{baseUrl}}/api/v1/users/{{userId}}"),
    req("Update User", "PATCH", "{{baseUrl}}/api/v1/users/{{userId}}", {
      body: { firstName: "Sara", lastName: "Hassan Updated" },
    }),
    req("Deactivate User", "POST", "{{baseUrl}}/api/v1/users/{{userId}}/deactivate"),
  ]),
  folder("03 — Warehouses", [
    req("List Warehouses", "GET", "{{baseUrl}}/api/v1/warehouses?page=1&limit=20"),
    req("Create Warehouse", "POST", "{{baseUrl}}/api/v1/warehouses", {
      body: {
        name: "Central Warehouse",
        code: "WH01",
        address: "Industrial Zone",
        phone: "+963900000000",
      },
    }),
    req("Get Warehouse by ID", "GET", "{{baseUrl}}/api/v1/warehouses/{{warehouseId}}"),
    req("Update Warehouse", "PATCH", "{{baseUrl}}/api/v1/warehouses/{{warehouseId}}", {
      body: { name: "Central Warehouse Updated", address: "Industrial Zone 2" },
    }),
    req(
      "Deactivate Warehouse",
      "POST",
      "{{baseUrl}}/api/v1/warehouses/{{warehouseId}}/deactivate"
    ),
  ]),
  folder("04 — Pharmacies", [
    req("List Pharmacies", "GET", "{{baseUrl}}/api/v1/pharmacies?page=1&limit=20"),
    req("Create Pharmacy", "POST", "{{baseUrl}}/api/v1/pharmacies", {
      body: {
        name: "Pharmacy A",
        code: "PH01",
        address: "Main Street",
        phone: "+963922222222",
        primaryWarehouseId: "{{warehouseId}}",
      },
    }),
    req("Get Pharmacy by ID", "GET", "{{baseUrl}}/api/v1/pharmacies/{{pharmacyId}}"),
    req("Update Pharmacy", "PATCH", "{{baseUrl}}/api/v1/pharmacies/{{pharmacyId}}", {
      body: { name: "Pharmacy A Updated", address: "Main Street 2" },
    }),
    req(
      "Deactivate Pharmacy",
      "POST",
      "{{baseUrl}}/api/v1/pharmacies/{{pharmacyId}}/deactivate"
    ),
  ]),
  folder("05 — Categories", [
    req("List Categories", "GET", "{{baseUrl}}/api/v1/categories?page=1&limit=20"),
    req("Create Category", "POST", "{{baseUrl}}/api/v1/categories", {
      body: { name: "Pain Relief", description: "Analgesics" },
    }),
    req("Get Category by ID", "GET", "{{baseUrl}}/api/v1/categories/{{categoryId}}"),
    req("Update Category", "PATCH", "{{baseUrl}}/api/v1/categories/{{categoryId}}", {
      body: { name: "Pain Relief Updated", description: "Updated" },
    }),
    req(
      "Deactivate Category",
      "POST",
      "{{baseUrl}}/api/v1/categories/{{categoryId}}/deactivate"
    ),
  ]),
  folder("06 — Manufacturers", [
    req("List Manufacturers", "GET", "{{baseUrl}}/api/v1/manufacturers?page=1&limit=20"),
    req("Create Manufacturer", "POST", "{{baseUrl}}/api/v1/manufacturers", {
      body: { name: "GSK", country: "UK" },
    }),
    req(
      "Get Manufacturer by ID",
      "GET",
      "{{baseUrl}}/api/v1/manufacturers/{{manufacturerId}}"
    ),
    req(
      "Update Manufacturer",
      "PATCH",
      "{{baseUrl}}/api/v1/manufacturers/{{manufacturerId}}",
      { body: { name: "GSK Updated", country: "UK" } }
    ),
    req(
      "Deactivate Manufacturer",
      "POST",
      "{{baseUrl}}/api/v1/manufacturers/{{manufacturerId}}/deactivate"
    ),
  ]),
  folder("07 — Active Ingredients", [
    req(
      "List Active Ingredients",
      "GET",
      "{{baseUrl}}/api/v1/active-ingredients?page=1&limit=20"
    ),
    req("Create Active Ingredient", "POST", "{{baseUrl}}/api/v1/active-ingredients", {
      body: { name: "Paracetamol" },
    }),
    req(
      "Get Active Ingredient by ID",
      "GET",
      "{{baseUrl}}/api/v1/active-ingredients/{{ingredientId}}"
    ),
    req(
      "Update Active Ingredient",
      "PATCH",
      "{{baseUrl}}/api/v1/active-ingredients/{{ingredientId}}",
      { body: { name: "Paracetamol Updated" } }
    ),
    req(
      "Deactivate Active Ingredient",
      "POST",
      "{{baseUrl}}/api/v1/active-ingredients/{{ingredientId}}/deactivate"
    ),
  ]),
  folder("08 — Drugs", [
    req("List Drugs", "GET", "{{baseUrl}}/api/v1/drugs?page=1&limit=20"),
    req(
      "List Drug Alternatives by Ingredient",
      "GET",
      "{{baseUrl}}/api/v1/drugs/by-active-ingredient/{{ingredientId}}?page=1&limit=20"
    ),
    req("Create Drug", "POST", "{{baseUrl}}/api/v1/drugs", {
      body: {
        name: "Panadol 500mg",
        activeIngredientIds: ["{{ingredientId}}"],
        categoryId: "{{categoryId}}",
        manufacturerId: "{{manufacturerId}}",
        dosageForm: "Tablet",
        concentration: "500mg",
        barcode: "6281000000001",
        sellingPrice: 1500,
        minimumStockThreshold: 10,
      },
    }),
    req("Get Drug by ID", "GET", "{{baseUrl}}/api/v1/drugs/{{drugId}}"),
    req("Update Drug", "PATCH", "{{baseUrl}}/api/v1/drugs/{{drugId}}", {
      body: { name: "Panadol 500mg Updated", dosageForm: "Tablet" },
    }),
    req(
      "Update Drug Selling Price",
      "PATCH",
      "{{baseUrl}}/api/v1/drugs/{{drugId}}/selling-price",
      { body: { sellingPrice: 1800 } }
    ),
    req("List Drug Price History", "GET", "{{baseUrl}}/api/v1/drugs/{{drugId}}/price-history"),
    req("Deactivate Drug", "POST", "{{baseUrl}}/api/v1/drugs/{{drugId}}/deactivate"),
  ]),
  folder("09 — Batches", [
    req("List Batches", "GET", "{{baseUrl}}/api/v1/batches?page=1&limit=20"),
    req("List FEFO Batches by Drug", "GET", "{{baseUrl}}/api/v1/batches/fefo/{{drugId}}"),
    req("Create Batch", "POST", "{{baseUrl}}/api/v1/batches", {
      body: {
        drugId: "{{drugId}}",
        batchNumber: "BN-MANUAL-001",
        expiryDate: "2027-06-30",
        manufacturingDate: "2025-01-01",
      },
      events: [saveId("batchId")],
    }),
    req("Get Batch by ID", "GET", "{{baseUrl}}/api/v1/batches/{{batchId}}"),
    req("Update Batch", "PATCH", "{{baseUrl}}/api/v1/batches/{{batchId}}", {
      body: { notes: "Updated notes" },
    }),
    req("Deactivate Batch", "POST", "{{baseUrl}}/api/v1/batches/{{batchId}}/deactivate"),
  ]),
  folder("10 — Inventory (read-only)", [
    req(
      "List Inventory",
      "GET",
      "{{baseUrl}}/api/v1/inventory?locationType=warehouse&locationId={{warehouseId}}"
    ),
    req(
      "Get Inventory Summary",
      "GET",
      "{{baseUrl}}/api/v1/inventory/summary?locationType=warehouse&locationId={{warehouseId}}&drugId={{drugId}}"
    ),
    req("Get Inventory Row by ID", "GET", "{{baseUrl}}/api/v1/inventory/{{inventoryId}}"),
  ]),
  folder("11 — Stock Movements", [
    req("List Stock Movements", "GET", "{{baseUrl}}/api/v1/stock-movements?page=1&limit=20"),
    req(
      "Create Stock Movement (non-domain types only)",
      "POST",
      "{{baseUrl}}/api/v1/stock-movements",
      {
        body: {
          drugId: "{{drugId}}",
          batchId: "{{batchId}}",
          locationType: "warehouse",
          locationId: "{{warehouseId}}",
          direction: "in",
          quantity: 1,
          movementType: "ADJUSTMENT",
          reason: "Manual note — prefer dedicated modules",
        },
        description:
          "Domain types (sale/purchase/transfer/etc.) are blocked. Prefer dedicated modules.",
      }
    ),
    req(
      "Get Stock Movement by ID",
      "GET",
      "{{baseUrl}}/api/v1/stock-movements/{{stockMovementId}}"
    ),
  ]),
  folder("12 — Suppliers", [
    req("List Suppliers", "GET", "{{baseUrl}}/api/v1/suppliers?page=1&limit=20"),
    req("Create Supplier", "POST", "{{baseUrl}}/api/v1/suppliers", {
      body: {
        name: "MedSupply Co.",
        code: "SUP01",
        phone: "+963900000001",
        email: "orders@medsupply.com",
        address: "Industrial Zone",
      },
    }),
    req("Get Supplier by ID", "GET", "{{baseUrl}}/api/v1/suppliers/{{supplierId}}"),
    req("Update Supplier", "PATCH", "{{baseUrl}}/api/v1/suppliers/{{supplierId}}", {
      body: { name: "MedSupply Co. Updated", phone: "+963900000001" },
    }),
    req(
      "Deactivate Supplier",
      "POST",
      "{{baseUrl}}/api/v1/suppliers/{{supplierId}}/deactivate"
    ),
  ]),
  folder("13 — Purchase Requests", [
    req(
      "List Purchase Requests",
      "GET",
      "{{baseUrl}}/api/v1/purchase-requests?page=1&limit=20"
    ),
    req("Create Purchase Request", "POST", "{{baseUrl}}/api/v1/purchase-requests", {
      body: {
        warehouseId: "{{warehouseId}}",
        supplierId: "{{supplierId}}",
        items: [{ drugId: "{{drugId}}", requestedQuantity: 50, unitCost: 1200 }],
      },
    }),
    req(
      "Get Purchase Request by ID",
      "GET",
      "{{baseUrl}}/api/v1/purchase-requests/{{purchaseRequestId}}"
    ),
    req(
      "Approve Purchase Request",
      "POST",
      "{{baseUrl}}/api/v1/purchase-requests/{{purchaseRequestId}}/approve",
      {
        body: {
          items: [{ drugId: "{{drugId}}", approvedQuantity: 50, unitCost: 1200 }],
        },
      }
    ),
    req(
      "Reject Purchase Request",
      "POST",
      "{{baseUrl}}/api/v1/purchase-requests/{{purchaseRequestId}}/reject",
      { body: { reason: "Not needed" } }
    ),
    req(
      "Cancel Purchase Request",
      "POST",
      "{{baseUrl}}/api/v1/purchase-requests/{{purchaseRequestId}}/cancel"
    ),
  ]),
  folder("14 — Purchase Orders", [
    req("List Purchase Orders", "GET", "{{baseUrl}}/api/v1/purchase-orders?page=1&limit=20"),
    req(
      "Get Purchase Order by ID",
      "GET",
      "{{baseUrl}}/api/v1/purchase-orders/{{purchaseOrderId}}"
    ),
  ]),
  folder("15 — Purchase Receipts", [
    req(
      "List Purchase Receipts",
      "GET",
      "{{baseUrl}}/api/v1/purchase-receipts?page=1&limit=20"
    ),
    req("Create Purchase Receipt", "POST", "{{baseUrl}}/api/v1/purchase-receipts", {
      body: {
        purchaseOrderId: "{{purchaseOrderId}}",
        invoiceNumber: "INV-2026-0001",
        items: [
          {
            drugId: "{{drugId}}",
            batchNumber: "BN2026-100",
            expiryDate: "2027-12-31",
            quantity: 100,
            unitCost: 1200,
          },
        ],
      },
    }),
    req(
      "Get Purchase Receipt by ID",
      "GET",
      "{{baseUrl}}/api/v1/purchase-receipts/{{purchaseReceiptId}}"
    ),
  ]),
  folder("16 — Purchase Invoices", [
    req(
      "List Purchase Invoices",
      "GET",
      "{{baseUrl}}/api/v1/purchase-invoices?page=1&limit=20"
    ),
    req(
      "Get Purchase Invoice by ID",
      "GET",
      "{{baseUrl}}/api/v1/purchase-invoices/{{purchaseInvoiceId}}"
    ),
  ]),
  folder("17 — Payment Methods", [
    req(
      "List Payment Methods",
      "GET",
      "{{baseUrl}}/api/v1/payment-methods?page=1&limit=20"
    ),
    req("Create Payment Method", "POST", "{{baseUrl}}/api/v1/payment-methods", {
      body: { name: "Cash", code: "CASH" },
    }),
    req(
      "Get Payment Method by ID",
      "GET",
      "{{baseUrl}}/api/v1/payment-methods/{{paymentMethodId}}"
    ),
    req(
      "Update Payment Method",
      "PATCH",
      "{{baseUrl}}/api/v1/payment-methods/{{paymentMethodId}}",
      { body: { name: "Cash Updated" } }
    ),
    req(
      "Deactivate Payment Method",
      "POST",
      "{{baseUrl}}/api/v1/payment-methods/{{paymentMethodId}}/deactivate"
    ),
  ]),
  folder("18 — Supply Requests", [
    req("List Supply Requests", "GET", "{{baseUrl}}/api/v1/supply-requests?page=1&limit=20"),
    req(
      "Create Pharmacy Supply Request",
      "POST",
      "{{baseUrl}}/api/v1/supply-requests/pharmacy",
      {
        body: {
          pharmacyId: "{{pharmacyId}}",
          items: [{ drugId: "{{drugId}}", requestedQuantity: 20 }],
        },
      }
    ),
    req(
      "Create Warehouse Supply Request",
      "POST",
      "{{baseUrl}}/api/v1/supply-requests/warehouse",
      {
        body: {
          warehouseId: "{{warehouseId}}",
          pharmacyId: "{{pharmacyId}}",
          items: [{ drugId: "{{drugId}}", requestedQuantity: 20 }],
        },
      }
    ),
    req(
      "Get Supply Request by ID",
      "GET",
      "{{baseUrl}}/api/v1/supply-requests/{{supplyRequestId}}"
    ),
    req(
      "Approve Supply Request",
      "POST",
      "{{baseUrl}}/api/v1/supply-requests/{{supplyRequestId}}/approve",
      {
        body: {
          items: [{ drugId: "{{drugId}}", approvedQuantity: 20, itemReason: "" }],
        },
      }
    ),
    req(
      "Reject Supply Request",
      "POST",
      "{{baseUrl}}/api/v1/supply-requests/{{supplyRequestId}}/reject",
      { body: { reason: "Insufficient stock" } }
    ),
    req(
      "Cancel Supply Request",
      "POST",
      "{{baseUrl}}/api/v1/supply-requests/{{supplyRequestId}}/cancel"
    ),
  ]),
  folder("19 — Shipments", [
    req("List Shipments", "GET", "{{baseUrl}}/api/v1/shipments?page=1&limit=20"),
    req("Prepare Shipment", "POST", "{{baseUrl}}/api/v1/shipments", {
      body: {
        supplyRequestId: "{{supplyRequestId}}",
        items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", sentQuantity: 20 }],
      },
    }),
    req("Get Shipment by ID", "GET", "{{baseUrl}}/api/v1/shipments/{{shipmentId}}"),
    req("Send Shipment", "POST", "{{baseUrl}}/api/v1/shipments/{{shipmentId}}/send"),
    req("Receive Shipment", "POST", "{{baseUrl}}/api/v1/shipments/{{shipmentId}}/receive", {
      body: {
        items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", receivedQuantity: 20 }],
      },
    }),
  ]),
  folder("20 — Sales Invoices", [
    req("List Sales Invoices", "GET", "{{baseUrl}}/api/v1/sales-invoices?page=1&limit=20"),
    req("Create Sales Invoice (FEFO)", "POST", "{{baseUrl}}/api/v1/sales-invoices", {
      body: {
        pharmacyId: "{{pharmacyId}}",
        paymentMethodId: "{{paymentMethodId}}",
        customer: { name: "Ahmad Ali", nationalId: "" },
        items: [{ drugId: "{{drugId}}", quantity: 1 }],
      },
    }),
    req(
      "Get Sales Invoice by ID",
      "GET",
      "{{baseUrl}}/api/v1/sales-invoices/{{salesInvoiceId}}"
    ),
  ]),
  folder("21 — Customer Returns", [
    req(
      "List Customer Returns",
      "GET",
      "{{baseUrl}}/api/v1/customer-returns?page=1&limit=20"
    ),
    req("Create Customer Return", "POST", "{{baseUrl}}/api/v1/customer-returns", {
      body: {
        salesInvoiceId: "{{salesInvoiceId}}",
        items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
      },
    }),
    req(
      "Get Customer Return by ID",
      "GET",
      "{{baseUrl}}/api/v1/customer-returns/{{customerReturnId}}"
    ),
  ]),
  folder("22 — Pharmacy Returns", [
    req(
      "List Pharmacy Returns",
      "GET",
      "{{baseUrl}}/api/v1/pharmacy-returns?page=1&limit=20"
    ),
    req("Create Pharmacy Return", "POST", "{{baseUrl}}/api/v1/pharmacy-returns", {
      body: {
        pharmacyId: "{{pharmacyId}}",
        reason: "Near expiry",
        items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", sentQuantity: 1 }],
      },
    }),
    req(
      "Get Pharmacy Return by ID",
      "GET",
      "{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}"
    ),
    req(
      "Send Pharmacy Return",
      "POST",
      "{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}/send"
    ),
    req(
      "Receive Pharmacy Return",
      "POST",
      "{{baseUrl}}/api/v1/pharmacy-returns/{{pharmacyReturnId}}/receive",
      {
        body: {
          items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", receivedQuantity: 1 }],
        },
      }
    ),
  ]),
  folder("23 — Supplier Returns", [
    req(
      "List Supplier Returns",
      "GET",
      "{{baseUrl}}/api/v1/supplier-returns?page=1&limit=20"
    ),
    req("Create Supplier Return", "POST", "{{baseUrl}}/api/v1/supplier-returns", {
      body: {
        warehouseId: "{{warehouseId}}",
        supplierId: "{{supplierId}}",
        reason: "Damaged",
        items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
      },
    }),
    req(
      "Get Supplier Return by ID",
      "GET",
      "{{baseUrl}}/api/v1/supplier-returns/{{supplierReturnId}}"
    ),
  ]),
  folder("24 — Destructions", [
    req("List Destructions", "GET", "{{baseUrl}}/api/v1/destructions?page=1&limit=20"),
    req("Record Destruction", "POST", "{{baseUrl}}/api/v1/destructions", {
      body: {
        locationType: "warehouse",
        locationId: "{{warehouseId}}",
        reason: "Expired",
        items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
      },
    }),
    req("Get Destruction by ID", "GET", "{{baseUrl}}/api/v1/destructions/{{destructionId}}"),
  ]),
  folder("25 — Inventory Adjustments", [
    req(
      "List Inventory Adjustments",
      "GET",
      "{{baseUrl}}/api/v1/inventory-adjustments?page=1&limit=20"
    ),
    req(
      "Create Inventory Adjustment",
      "POST",
      "{{baseUrl}}/api/v1/inventory-adjustments",
      {
        body: {
          locationType: "pharmacy",
          locationId: "{{pharmacyId}}",
          reason: "Count correction",
          items: [
            {
              drugId: "{{drugId}}",
              batchId: "{{batchId}}",
              quantity: 1,
              direction: "in",
            },
          ],
        },
      }
    ),
    req(
      "Get Inventory Adjustment by ID",
      "GET",
      "{{baseUrl}}/api/v1/inventory-adjustments/{{inventoryAdjustmentId}}"
    ),
  ]),
  folder("26 — Notifications", [
    req("List Notifications", "GET", "{{baseUrl}}/api/v1/notifications?page=1&limit=20"),
    req(
      "Get Unread Notification Count",
      "GET",
      "{{baseUrl}}/api/v1/notifications/unread-count"
    ),
    req("Run Alert Scan", "POST", "{{baseUrl}}/api/v1/notifications/run-alerts"),
    req("Mark All Notifications Read", "POST", "{{baseUrl}}/api/v1/notifications/mark-all-read"),
    req(
      "Mark Notification Read",
      "PATCH",
      "{{baseUrl}}/api/v1/notifications/{{notificationId}}/read"
    ),
  ]),
  folder("27 — Audit Logs", [
    req("List Audit Logs", "GET", "{{baseUrl}}/api/v1/audit-logs?page=1&limit=20"),
    req("Get Audit Log by ID", "GET", "{{baseUrl}}/api/v1/audit-logs/{{auditLogId}}"),
  ]),
  folder("28 — Reports", [
    req("Report: Sales", "GET", "{{baseUrl}}/api/v1/reports/sales"),
    req(
      "Report: Best-Selling Drugs",
      "GET",
      "{{baseUrl}}/api/v1/reports/best-selling-drugs?limit=10"
    ),
    req("Report: Purchases", "GET", "{{baseUrl}}/api/v1/reports/purchases"),
    req("Report: Stock Movements", "GET", "{{baseUrl}}/api/v1/reports/stock-movements"),
    req(
      "Report: Inventory",
      "GET",
      "{{baseUrl}}/api/v1/reports/inventory?locationType=pharmacy&locationId={{pharmacyId}}"
    ),
    req("Report: Near Expiry", "GET", "{{baseUrl}}/api/v1/reports/near-expiry?days=30"),
    req("Report: Expired", "GET", "{{baseUrl}}/api/v1/reports/expired"),
  ]),
];

function countReqs(items) {
  let n = 0;
  for (const it of items) {
    if (it.request) n += 1;
    if (it.item) n += countReqs(it.item);
  }
  return n;
}

const variables = [
  "baseUrl",
  "warehouseId",
  "pharmacyId",
  "categoryId",
  "manufacturerId",
  "ingredientId",
  "drugId",
  "batchId",
  "supplierId",
  "paymentMethodId",
  "purchaseRequestId",
  "purchaseOrderId",
  "purchaseReceiptId",
  "purchaseInvoiceId",
  "supplyRequestId",
  "shipmentId",
  "salesInvoiceId",
  "customerReturnId",
  "pharmacyReturnId",
  "supplierReturnId",
  "destructionId",
  "inventoryAdjustmentId",
  "userId",
  "inventoryId",
  "stockMovementId",
  "notificationId",
  "auditLogId",
].map((k) => ({
  key: k,
  value: k === "baseUrl" ? "http://localhost:3000" : "",
}));

const collection = {
  info: {
    name: "Pharmacy Management System",
    description:
      "Complete API collection.\n\n**00 — Master E2E Flow**: run in order (cookies + auto-save IDs).\n**01–28**: full endpoint reference by module.\n\nLogin: admin@example.com / Admin12345\nAuth: HttpOnly cookies (no Bearer).",
    schema: "https://schema.postman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "noauth" },
  item: full,
  variable: variables,
};

const out = path.join(__dirname, "..", "postman-collection.generated.json");
fs.writeFileSync(out, JSON.stringify({ collection }, null, 2));
console.log("Wrote", out);
console.log("Request count:", countReqs(full));
