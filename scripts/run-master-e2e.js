import fs from "fs";
import http from "http";

const BASE = "http://localhost:3000";
const cookieJar = new Map();
const vars = {};
const stamp = Date.now().toString().slice(-6);
const results = [];

function parseSetCookie(headers) {
  const raw = headers["set-cookie"];
  if (!raw) return;
  for (const line of raw) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith("http") ? path : BASE + path);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { Accept: "application/json" };
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const c = cookieHeader();
    if (c) headers.Cookie = c;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        parseSetCookie(res.headers);
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, json, raw: data });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function step(name, method, path, body, { expect = [200, 201], save } = {}) {
  const resolvedPath = path.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  let resolvedBody = body;
  if (body) {
    const s = JSON.stringify(body).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
    resolvedBody = JSON.parse(s);
  }
  const res = await request(method, resolvedPath, resolvedBody);
  const ok = expect.includes(res.status) && res.json?.success !== false;
  const entry = {
    name,
    method,
    path: resolvedPath,
    status: res.status,
    ok,
    message: res.json?.message || res.json?.data?.code || "",
  };
  if (!ok) entry.error = res.json;
  if (ok && save) {
    try {
      save(res.json, vars);
    } catch (e) {
      entry.ok = false;
      entry.message = `save failed: ${e.message}`;
    }
  }
  results.push(entry);
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} [${res.status}] ${name}`);
  if (!ok) console.log("  ", JSON.stringify(res.json)?.slice(0, 400));
  return res;
}

async function main() {
  // A
  await step("A1 Health", "GET", "/api/v1/health");
  await step("A2 Login", "POST", "/api/v1/auth/login", {
    email: "admin@example.com",
    password: "Admin12345",
  });
  await step("A3 Me", "GET", "/api/v1/auth/me");

  // B
  await step(
    "B1 Warehouse",
    "POST",
    "/api/v1/warehouses",
    {
      name: `Central Warehouse ${stamp}`,
      code: `WH${stamp}`,
      address: "Industrial Zone",
      phone: "+963900000000",
    },
    { save: (j, v) => (v.warehouseId = j.data.id) }
  );
  await step(
    "B2 Pharmacy",
    "POST",
    "/api/v1/pharmacies",
    {
      name: `Pharmacy ${stamp}`,
      code: `PH${stamp}`,
      address: "Main Street",
      phone: "+963922222222",
      primaryWarehouseId: "{{warehouseId}}",
    },
    { save: (j, v) => (v.pharmacyId = j.data.id) }
  );

  // C
  await step(
    "C1 Category",
    "POST",
    "/api/v1/categories",
    { name: `Pain Relief ${stamp}`, description: "Analgesics" },
    { save: (j, v) => (v.categoryId = j.data.id) }
  );
  await step(
    "C2 Manufacturer",
    "POST",
    "/api/v1/manufacturers",
    { name: `GSK ${stamp}`, country: "UK" },
    { save: (j, v) => (v.manufacturerId = j.data.id) }
  );
  await step(
    "C3 Ingredient",
    "POST",
    "/api/v1/active-ingredients",
    { name: `Paracetamol ${stamp}` },
    { save: (j, v) => (v.ingredientId = j.data.id) }
  );
  await step(
    "C4 Drug",
    "POST",
    "/api/v1/drugs",
    {
      name: `Panadol ${stamp}`,
      activeIngredientIds: ["{{ingredientId}}"],
      categoryId: "{{categoryId}}",
      manufacturerId: "{{manufacturerId}}",
      dosageForm: "Tablet",
      concentration: "500mg",
      barcode: `6281${stamp}001`,
      sellingPrice: 1500,
      minimumStockThreshold: 10,
    },
    { save: (j, v) => (v.drugId = j.data.id) }
  );

  // D
  await step(
    "D1 Payment Method",
    "POST",
    "/api/v1/payment-methods",
    { name: `Cash ${stamp}`, code: `CASH${stamp}` },
    { save: (j, v) => (v.paymentMethodId = j.data.id) }
  );
  await step(
    "D2 Supplier",
    "POST",
    "/api/v1/suppliers",
    {
      name: `MedSupply ${stamp}`,
      code: `SUP${stamp}`,
      phone: "+963900000001",
      email: `orders${stamp}@medsupply.com`,
      address: "Industrial Zone",
    },
    { save: (j, v) => (v.supplierId = j.data.id) }
  );
  await step(
    "D3 Purchase Request",
    "POST",
    "/api/v1/purchase-requests",
    {
      warehouseId: "{{warehouseId}}",
      supplierId: "{{supplierId}}",
      items: [{ drugId: "{{drugId}}", requestedQuantity: 100, unitCost: 1200 }],
    },
    {
      save: (j, v) => {
        const d = j.data;
        v.purchaseRequestId = d.request?.id || d.id;
        if (d.purchaseOrder?.id) v.purchaseOrderId = d.purchaseOrder.id;
      },
    }
  );
  if (!vars.purchaseOrderId) {
    console.log("FAIL missing purchaseOrderId after D3");
    results.push({ name: "D3b PO id", ok: false, status: 0, message: "no PO" });
  }
  await step(
    "D4 Receive Purchase",
    "POST",
    "/api/v1/purchase-receipts",
    {
      purchaseOrderId: "{{purchaseOrderId}}",
      invoiceNumber: `INV-${stamp}`,
      items: [
        {
          drugId: "{{drugId}}",
          batchNumber: `BN${stamp}`,
          expiryDate: "2027-12-31",
          quantity: 100,
          unitCost: 1200,
        },
      ],
    },
    {
      save: (j, v) => {
        v.batchId = j.data?.receipt?.items?.[0]?.batchId;
      },
    }
  );
  await step(
    "D5 Warehouse Inventory",
    "GET",
    `/api/v1/inventory?locationType=warehouse&locationId=${vars.warehouseId}`
  );

  // E
  await step(
    "E1 Supply Request",
    "POST",
    "/api/v1/supply-requests/pharmacy",
    {
      pharmacyId: "{{pharmacyId}}",
      items: [{ drugId: "{{drugId}}", requestedQuantity: 50 }],
    },
    { save: (j, v) => (v.supplyRequestId = j.data.id) }
  );
  await step(
    "E2 Approve Supply",
    "POST",
    "/api/v1/supply-requests/{{supplyRequestId}}/approve",
    { items: [{ drugId: "{{drugId}}", approvedQuantity: 50, itemReason: "" }] }
  );
  await step(
    "E3 Prepare Shipment",
    "POST",
    "/api/v1/shipments",
    {
      supplyRequestId: "{{supplyRequestId}}",
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", sentQuantity: 50 }],
    },
    { save: (j, v) => (v.shipmentId = j.data.id) }
  );
  await step("E4 Send Shipment", "POST", "/api/v1/shipments/{{shipmentId}}/send");
  await step(
    "E5 Receive Shipment",
    "POST",
    "/api/v1/shipments/{{shipmentId}}/receive",
    {
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", receivedQuantity: 50 }],
    }
  );
  await step(
    "E6 Pharmacy Inventory",
    "GET",
    `/api/v1/inventory?locationType=pharmacy&locationId=${vars.pharmacyId}`
  );

  // F
  await step(
    "F1 Sales Invoice",
    "POST",
    "/api/v1/sales-invoices",
    {
      pharmacyId: "{{pharmacyId}}",
      paymentMethodId: "{{paymentMethodId}}",
      customer: { name: "Ahmad Ali", nationalId: "" },
      items: [{ drugId: "{{drugId}}", quantity: 2 }],
    },
    {
      save: (j, v) => {
        v.salesInvoiceId = j.data.id;
        if (j.data?.items?.[0]?.batchId) v.batchId = j.data.items[0].batchId;
      },
    }
  );
  await step("F2 List Sales", "GET", "/api/v1/sales-invoices");
  await step("F3 Get Sales", "GET", "/api/v1/sales-invoices/{{salesInvoiceId}}");
  await step(
    "F5 Update Price",
    "PATCH",
    "/api/v1/drugs/{{drugId}}/selling-price",
    { sellingPrice: 1800 }
  );

  // G
  await step(
    "G1 Customer Return",
    "POST",
    "/api/v1/customer-returns",
    {
      salesInvoiceId: "{{salesInvoiceId}}",
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
    },
    { save: (j, v) => (v.customerReturnId = j.data.id) }
  );
  await step(
    "G2 Pharmacy Return",
    "POST",
    "/api/v1/pharmacy-returns",
    {
      pharmacyId: "{{pharmacyId}}",
      reason: "Near expiry overstock",
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", sentQuantity: 5 }],
    },
    { save: (j, v) => (v.pharmacyReturnId = j.data.id) }
  );
  await step(
    "G3 Send Pharmacy Return",
    "POST",
    "/api/v1/pharmacy-returns/{{pharmacyReturnId}}/send"
  );
  await step(
    "G4 Receive Pharmacy Return",
    "POST",
    "/api/v1/pharmacy-returns/{{pharmacyReturnId}}/receive",
    {
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", receivedQuantity: 5 }],
    }
  );
  await step(
    "G5 Supplier Return",
    "POST",
    "/api/v1/supplier-returns",
    {
      warehouseId: "{{warehouseId}}",
      supplierId: "{{supplierId}}",
      reason: "Damaged on arrival",
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 5 }],
    }
  );
  await step(
    "G6 Destruction",
    "POST",
    "/api/v1/destructions",
    {
      locationType: "warehouse",
      locationId: "{{warehouseId}}",
      reason: "Expired and unsellable",
      items: [{ drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1 }],
    }
  );
  await step(
    "G7 Adjustment",
    "POST",
    "/api/v1/inventory-adjustments",
    {
      locationType: "pharmacy",
      locationId: "{{pharmacyId}}",
      reason: "Physical count correction",
      items: [
        { drugId: "{{drugId}}", batchId: "{{batchId}}", quantity: 1, direction: "in" },
      ],
    }
  );

  // H
  await step("H1 Alerts", "POST", "/api/v1/notifications/run-alerts");
  await step("H2 Notifications", "GET", "/api/v1/notifications?status=UNREAD");
  await step("H3 Audit", "GET", "/api/v1/audit-logs");
  await step("H4 Sales Report", "GET", "/api/v1/reports/sales");
  await step(
    "H5 Inventory Report",
    "GET",
    `/api/v1/reports/inventory?locationType=pharmacy&locationId=${vars.pharmacyId}`
  );
  await step("H6 Near Expiry", "GET", "/api/v1/reports/near-expiry?days=30");
  await step("H7 Best Selling", "GET", "/api/v1/reports/best-selling-drugs?limit=10");
  await step("H8 Purchases Report", "GET", "/api/v1/reports/purchases");
  await step("H9 Expired Report", "GET", "/api/v1/reports/expired");
  await step("H10 Stock Movements Report", "GET", "/api/v1/reports/stock-movements");

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log("\n==== SUMMARY ====");
  console.log(`Passed: ${passed}/${results.length}`);
  if (failed.length) {
    console.log("Failed:");
    for (const f of failed) {
      console.log(` - ${f.name} [${f.status}] ${f.message}`);
    }
  }
  console.log("\nVars:", JSON.stringify(vars, null, 2));
  fs.writeFileSync(
    "e2e-master-results.json",
    JSON.stringify({ passed, total: results.length, failed, results, vars }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
