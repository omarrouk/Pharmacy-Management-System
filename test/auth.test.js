import assert from "node:assert/strict";
import test from "node:test";
import {
  getPermissionsForRole,
  hasPermission,
  PERMISSIONS,
} from "../src/constants/permissions.js";
import { ROLES } from "../src/constants/roles.js";
import { authorize } from "../src/middlewares/authorize.js";
import { canAccessPharmacy, canAccessWarehouse } from "../src/utils/scope.js";

test("system admin has all current permissions", () => {
  assert.equal(
    hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.USERS_CREATE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.PERMISSIONS_READ),
    true,
  );
});

test("pharmacist cannot manage users", () => {
  assert.deepEqual(getPermissionsForRole(ROLES.PHARMACIST), [
    PERMISSIONS.ACTIVE_INGREDIENTS_READ,
    PERMISSIONS.DRUGS_READ,
    PERMISSIONS.BATCHES_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.STOCK_MOVEMENTS_READ,
    PERMISSIONS.SUPPLY_REQUESTS_READ,
    PERMISSIONS.SHIPMENTS_READ,
  ]);
  assert.equal(hasPermission(ROLES.PHARMACIST, PERMISSIONS.USERS_CREATE), false);
  assert.equal(
    hasPermission(ROLES.PHARMACIST, PERMISSIONS.STOCK_MOVEMENTS_CREATE),
    false,
  );
  assert.equal(
    hasPermission(ROLES.PHARMACIST, PERMISSIONS.SUPPLY_REQUESTS_CREATE),
    false,
  );
});

test("authorize rejects missing permission", () => {
  const req = { user: { role: ROLES.PHARMACIST } };
  let receivedError;

  authorize(PERMISSIONS.USERS_CREATE)(req, {}, (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 403);
  assert.equal(receivedError.code, "FORBIDDEN");
});

test("authorize allows matching permission", () => {
  const req = { user: { role: ROLES.SYSTEM_ADMIN } };
  let calledNextWithoutError = false;

  authorize(PERMISSIONS.USERS_READ)(req, {}, (error) => {
    calledNextWithoutError = error === undefined;
  });

  assert.equal(calledNextWithoutError, true);
});

test("system admin can create warehouses", () => {
  assert.equal(
    hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.WAREHOUSES_CREATE),
    true,
  );
});

test("pharmacy admin cannot create warehouses", () => {
  assert.equal(
    hasPermission(ROLES.PHARMACY_ADMIN, PERMISSIONS.WAREHOUSES_CREATE),
    false,
  );
  assert.equal(
    hasPermission(ROLES.PHARMACY_ADMIN, PERMISSIONS.WAREHOUSES_READ),
    true,
  );
});

test("warehouse manager can read and update warehouses", () => {
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.WAREHOUSES_READ),
    true,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.WAREHOUSES_UPDATE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.WAREHOUSES_DEACTIVATE),
    false,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.BATCHES_CREATE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.BATCHES_DEACTIVATE),
    false,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.STOCK_MOVEMENTS_CREATE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.SUPPLY_REQUESTS_APPROVE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.WAREHOUSE_MANAGER, PERMISSIONS.SHIPMENTS_SEND),
    true,
  );
});

test("pharmacy manager can read and update pharmacies", () => {
  assert.equal(
    hasPermission(ROLES.PHARMACY_MANAGER, PERMISSIONS.PHARMACIES_READ),
    true,
  );
  assert.equal(
    hasPermission(ROLES.PHARMACY_MANAGER, PERMISSIONS.PHARMACIES_UPDATE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.PHARMACY_MANAGER, PERMISSIONS.PHARMACIES_CREATE),
    false,
  );
});

test("pharmacist can read drugs for alternative search", () => {
  assert.equal(hasPermission(ROLES.PHARMACIST, PERMISSIONS.DRUGS_READ), true);
  assert.equal(
    hasPermission(ROLES.PHARMACIST, PERMISSIONS.ACTIVE_INGREDIENTS_READ),
    true,
  );
  assert.equal(hasPermission(ROLES.PHARMACIST, PERMISSIONS.DRUGS_CREATE), false);
});

test("pharmacy admin can manage catalog", () => {
  assert.equal(
    hasPermission(ROLES.PHARMACY_ADMIN, PERMISSIONS.DRUGS_CREATE),
    true,
  );
  assert.equal(
    hasPermission(ROLES.PHARMACY_ADMIN, PERMISSIONS.CATEGORIES_CREATE),
    true,
  );
});

test("resource scope blocks pharmacies outside the user links", () => {
  const user = {
    role: ROLES.PHARMACY_ADMIN,
    pharmacyIds: ["aaaaaaaaaaaaaaaaaaaaaaaa"],
    warehouseIds: ["bbbbbbbbbbbbbbbbbbbbbbbb"],
  };

  assert.equal(canAccessPharmacy(user, "aaaaaaaaaaaaaaaaaaaaaaaa"), true);
  assert.equal(canAccessPharmacy(user, "cccccccccccccccccccccccc"), false);
  assert.equal(canAccessWarehouse(user, "bbbbbbbbbbbbbbbbbbbbbbbb"), true);
  assert.equal(
    canAccessPharmacy({ role: ROLES.SYSTEM_ADMIN, pharmacyIds: [] }, "any"),
    true,
  );
});
