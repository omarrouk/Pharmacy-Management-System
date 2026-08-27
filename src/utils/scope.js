import { ROLES } from "../constants/roles.js";

const hasId = (ids, targetId) =>
  (ids ?? []).some((id) => String(id) === String(targetId));

export const canAccessPharmacy = (user, pharmacyId) => {
  if (!pharmacyId) return false;
  if (user.role === ROLES.SYSTEM_ADMIN) return true;
  return hasId(user.pharmacyIds, pharmacyId);
};

export const canAccessWarehouse = (user, warehouseId) => {
  if (!warehouseId) return false;
  if (user.role === ROLES.SYSTEM_ADMIN) return true;
  return hasId(user.warehouseIds, warehouseId);
};
