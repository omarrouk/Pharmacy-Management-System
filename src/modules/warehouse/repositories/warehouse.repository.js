import { Warehouse } from "../models/warehouse.model.js";

export const createWarehouse = (data) => Warehouse.create(data);

export const findWarehouseById = (id) => Warehouse.findById(id);

export const findWarehouseByCode = (code) =>
  Warehouse.findOne({ code: code.toUpperCase() });

export const listWarehouses = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Warehouse.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countWarehouses = (filter = {}) => Warehouse.countDocuments(filter);

export const updateWarehouseById = (id, data) =>
  Warehouse.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
