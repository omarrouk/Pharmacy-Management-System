import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessWarehouse } from "../../../utils/scope.js";
import * as warehouseRepository from "../repositories/warehouse.repository.js";

const toPublicWarehouse = (warehouse) => warehouse.toJSON();

const assertCanAccess = (actor, warehouseId) => {
  if (!canAccessWarehouse(actor, warehouseId)) {
    throw new AppError(
      "You cannot access this warehouse.",
      403,
      "FORBIDDEN",
    );
  }
};

const scopedListFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  return { _id: { $in: actor.warehouseIds ?? [] } };
};

export const createWarehouse = async (payload) => {
  const code = payload.code.toUpperCase();
  const existing = await warehouseRepository.findWarehouseByCode(code);

  if (existing) {
    throw new AppError("Warehouse code is already in use.", 409, "CODE_IN_USE");
  }

  const warehouse = await warehouseRepository.createWarehouse({
    name: payload.name,
    code,
    address: payload.address ?? "",
    phone: payload.phone ?? "",
  });

  return toPublicWarehouse(warehouse);
};

export const listWarehouses = async (actor, { page, limit }) => {
  const filter = scopedListFilter(actor);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    warehouseRepository.listWarehouses({ filter, skip, limit }),
    warehouseRepository.countWarehouses(filter),
  ]);

  return {
    items: items.map(toPublicWarehouse),
    page,
    limit,
    total,
  };
};

export const getWarehouseById = async (actor, id) => {
  const warehouse = await warehouseRepository.findWarehouseById(id);

  if (!warehouse) {
    throw new AppError("Warehouse was not found.", 404, "WAREHOUSE_NOT_FOUND");
  }

  assertCanAccess(actor, id);
  return toPublicWarehouse(warehouse);
};

export const updateWarehouse = async (actor, id, payload) => {
  const current = await warehouseRepository.findWarehouseById(id);

  if (!current) {
    throw new AppError("Warehouse was not found.", 404, "WAREHOUSE_NOT_FOUND");
  }

  assertCanAccess(actor, id);

  const data = { ...payload };

  if (payload.code) {
    const code = payload.code.toUpperCase();
    const existing = await warehouseRepository.findWarehouseByCode(code);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError(
        "Warehouse code is already in use.",
        409,
        "CODE_IN_USE",
      );
    }

    data.code = code;
  }

  const updated = await warehouseRepository.updateWarehouseById(id, data);
  return toPublicWarehouse(updated);
};

export const deactivateWarehouse = async (id) => {
  const warehouse = await warehouseRepository.findWarehouseById(id);

  if (!warehouse) {
    throw new AppError("Warehouse was not found.", 404, "WAREHOUSE_NOT_FOUND");
  }

  if (!warehouse.isActive) {
    return toPublicWarehouse(warehouse);
  }

  const updated = await warehouseRepository.updateWarehouseById(id, {
    isActive: false,
  });

  return toPublicWarehouse(updated);
};
