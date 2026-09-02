import { InventoryAdjustment } from "../models/inventoryAdjustment.model.js";

export const createInventoryAdjustment = (data, session) => {
  if (session) {
    return InventoryAdjustment.create([data], { session }).then(([doc]) => doc);
  }

  return InventoryAdjustment.create(data);
};

export const findInventoryAdjustmentById = (id) => InventoryAdjustment.findById(id);

export const listInventoryAdjustments = ({
  filter = {},
  skip = 0,
  limit = 20,
} = {}) =>
  InventoryAdjustment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countInventoryAdjustments = (filter = {}) =>
  InventoryAdjustment.countDocuments(filter);

export const countInventoryAdjustmentsWithPrefix = (prefix) =>
  InventoryAdjustment.countDocuments({
    adjustmentNumber: { $regex: `^${prefix}` },
  });
