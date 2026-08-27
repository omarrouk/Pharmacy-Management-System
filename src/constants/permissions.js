import { ROLES } from "./roles.js";

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DEACTIVATE: "users.deactivate",
  PERMISSIONS_READ: "permissions.read",
  WAREHOUSES_READ: "warehouses.read",
  WAREHOUSES_CREATE: "warehouses.create",
  WAREHOUSES_UPDATE: "warehouses.update",
  WAREHOUSES_DEACTIVATE: "warehouses.deactivate",
};

export const PERMISSION_VALUES = Object.values(PERMISSIONS);

const ALL_PERMISSIONS = PERMISSION_VALUES;

const ROLE_PERMISSIONS = {
  [ROLES.SYSTEM_ADMIN]: ALL_PERMISSIONS,
  [ROLES.PHARMACY_ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DEACTIVATE,
    PERMISSIONS.PERMISSIONS_READ,
    PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.WAREHOUSES_UPDATE,
  ],
  [ROLES.PHARMACY_MANAGER]: [PERMISSIONS.USERS_READ],
  [ROLES.WAREHOUSE_MANAGER]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.WAREHOUSES_UPDATE,
  ],
  [ROLES.PHARMACIST]: [],
  [ROLES.PHARMACY_EMPLOYEE]: [],
  [ROLES.WAREHOUSE_EMPLOYEE]: [],
};

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] ?? [];

export const hasPermission = (role, permission) =>
  getPermissionsForRole(role).includes(permission);
