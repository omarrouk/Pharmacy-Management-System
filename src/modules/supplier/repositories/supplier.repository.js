import { Supplier } from "../models/supplier.model.js";

export const createSupplier = (data) => Supplier.create(data);

export const findSupplierById = (id) => Supplier.findById(id);

export const findSupplierByCode = (code) =>
  Supplier.findOne({ code: code.toUpperCase() });

export const listSuppliers = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countSuppliers = (filter = {}) => Supplier.countDocuments(filter);

export const updateSupplierById = (id, data) =>
  Supplier.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
