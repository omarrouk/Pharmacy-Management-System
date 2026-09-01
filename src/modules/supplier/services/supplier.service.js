import { AppError } from "../../../utils/appError.js";
import * as supplierRepository from "../repositories/supplier.repository.js";

const toPublic = (doc) => doc.toJSON();

const buildListFilter = ({ search }) => {
  if (!search) return {};

  return {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ],
  };
};

export const createSupplier = async (payload) => {
  const code = payload.code.toUpperCase();
  const existing = await supplierRepository.findSupplierByCode(code);

  if (existing) {
    throw new AppError("Supplier code is already in use.", 409, "CODE_IN_USE");
  }

  const supplier = await supplierRepository.createSupplier({
    name: payload.name,
    code,
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    address: payload.address ?? "",
  });

  return toPublic(supplier);
};

export const listSuppliers = async ({ page, limit, search }) => {
  const filter = buildListFilter({ search });
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    supplierRepository.listSuppliers({ filter, skip, limit }),
    supplierRepository.countSuppliers(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getSupplierById = async (id) => {
  const supplier = await supplierRepository.findSupplierById(id);

  if (!supplier) {
    throw new AppError("Supplier was not found.", 404, "SUPPLIER_NOT_FOUND");
  }

  return toPublic(supplier);
};

export const assertActiveSupplier = async (id) => {
  const supplier = await supplierRepository.findSupplierById(id);

  if (!supplier || !supplier.isActive) {
    throw new AppError("Supplier was not found or is inactive.", 400, "INVALID_SUPPLIER");
  }

  return supplier;
};

export const updateSupplier = async (id, payload) => {
  const current = await supplierRepository.findSupplierById(id);

  if (!current) {
    throw new AppError("Supplier was not found.", 404, "SUPPLIER_NOT_FOUND");
  }

  const data = { ...payload };

  if (payload.code) {
    const code = payload.code.toUpperCase();
    const existing = await supplierRepository.findSupplierByCode(code);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError("Supplier code is already in use.", 409, "CODE_IN_USE");
    }

    data.code = code;
  }

  const updated = await supplierRepository.updateSupplierById(id, data);
  return toPublic(updated);
};

export const deactivateSupplier = async (id) => {
  const supplier = await supplierRepository.findSupplierById(id);

  if (!supplier) {
    throw new AppError("Supplier was not found.", 404, "SUPPLIER_NOT_FOUND");
  }

  if (!supplier.isActive) {
    return toPublic(supplier);
  }

  const updated = await supplierRepository.updateSupplierById(id, {
    isActive: false,
  });

  return toPublic(updated);
};
