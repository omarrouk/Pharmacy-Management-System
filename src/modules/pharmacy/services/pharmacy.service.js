import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessPharmacy } from "../../../utils/scope.js";
import * as warehouseRepository from "../../warehouse/repositories/warehouse.repository.js";
import * as pharmacyRepository from "../repositories/pharmacy.repository.js";

const toPublicPharmacy = (pharmacy) => pharmacy.toJSON();

const assertCanAccess = (actor, pharmacyId) => {
  if (!canAccessPharmacy(actor, pharmacyId)) {
    throw new AppError("You cannot access this pharmacy.", 403, "FORBIDDEN");
  }
};

const scopedListFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  return { _id: { $in: actor.pharmacyIds ?? [] } };
};

const assertPrimaryWarehouse = async (warehouseId) => {
  const warehouse = await warehouseRepository.findWarehouseById(warehouseId);

  if (!warehouse || !warehouse.isActive) {
    throw new AppError(
      "Primary warehouse was not found or is inactive.",
      400,
      "INVALID_WAREHOUSE",
    );
  }
};

export const createPharmacy = async (payload) => {
  await assertPrimaryWarehouse(payload.primaryWarehouseId);

  const code = payload.code.toUpperCase();
  const existing = await pharmacyRepository.findPharmacyByCode(code);

  if (existing) {
    throw new AppError("Pharmacy code is already in use.", 409, "CODE_IN_USE");
  }

  const pharmacy = await pharmacyRepository.createPharmacy({
    name: payload.name,
    code,
    address: payload.address ?? "",
    phone: payload.phone ?? "",
    primaryWarehouseId: payload.primaryWarehouseId,
  });

  return toPublicPharmacy(pharmacy);
};

export const listPharmacies = async (actor, { page, limit }) => {
  const filter = scopedListFilter(actor);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    pharmacyRepository.listPharmacies({ filter, skip, limit }),
    pharmacyRepository.countPharmacies(filter),
  ]);

  return {
    items: items.map(toPublicPharmacy),
    page,
    limit,
    total,
  };
};

export const getPharmacyById = async (actor, id) => {
  const pharmacy = await pharmacyRepository.findPharmacyById(id);

  if (!pharmacy) {
    throw new AppError("Pharmacy was not found.", 404, "PHARMACY_NOT_FOUND");
  }

  assertCanAccess(actor, id);
  return toPublicPharmacy(pharmacy);
};

export const updatePharmacy = async (actor, id, payload) => {
  const current = await pharmacyRepository.findPharmacyById(id);

  if (!current) {
    throw new AppError("Pharmacy was not found.", 404, "PHARMACY_NOT_FOUND");
  }

  assertCanAccess(actor, id);

  const data = { ...payload };

  if (
    payload.primaryWarehouseId &&
    actor.role !== ROLES.SYSTEM_ADMIN
  ) {
    throw new AppError(
      "Only a system admin can change the primary warehouse.",
      403,
      "FORBIDDEN",
    );
  }

  if (payload.primaryWarehouseId) {
    await assertPrimaryWarehouse(payload.primaryWarehouseId);
  }

  if (payload.code) {
    const code = payload.code.toUpperCase();
    const existing = await pharmacyRepository.findPharmacyByCode(code);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError("Pharmacy code is already in use.", 409, "CODE_IN_USE");
    }

    data.code = code;
  }

  const updated = await pharmacyRepository.updatePharmacyById(id, data);
  return toPublicPharmacy(updated);
};

export const deactivatePharmacy = async (id) => {
  const pharmacy = await pharmacyRepository.findPharmacyById(id);

  if (!pharmacy) {
    throw new AppError("Pharmacy was not found.", 404, "PHARMACY_NOT_FOUND");
  }

  if (!pharmacy.isActive) {
    return toPublicPharmacy(pharmacy);
  }

  const updated = await pharmacyRepository.updatePharmacyById(id, {
    isActive: false,
  });

  return toPublicPharmacy(updated);
};
