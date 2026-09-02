import { SupplierReturn } from "../models/supplierReturn.model.js";

export const createSupplierReturn = (data, session) => {
  if (session) {
    return SupplierReturn.create([data], { session }).then(([doc]) => doc);
  }

  return SupplierReturn.create(data);
};

export const findSupplierReturnById = (id) => SupplierReturn.findById(id);

export const listSupplierReturns = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  SupplierReturn.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countSupplierReturns = (filter = {}) =>
  SupplierReturn.countDocuments(filter);

export const countSupplierReturnsWithPrefix = (prefix) =>
  SupplierReturn.countDocuments({
    returnNumber: { $regex: `^${prefix}` },
  });
