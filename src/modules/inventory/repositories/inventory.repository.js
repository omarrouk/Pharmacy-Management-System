import mongoose from "mongoose";
import { Inventory } from "../models/inventory.model.js";

export const findInventoryById = (id) => Inventory.findById(id);

export const listInventory = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { updatedAt: -1 },
} = {}) => Inventory.find(filter).sort(sort).skip(skip).limit(limit);

export const countInventory = (filter = {}) => Inventory.countDocuments(filter);

export const increaseQuantity = (
  { locationType, locationId, drugId, batchId, quantity },
  session,
) =>
  Inventory.findOneAndUpdate(
    { locationType, locationId, batchId },
    {
      $setOnInsert: { locationType, locationId, drugId, batchId },
      $inc: { quantity },
    },
    { upsert: true, returnDocument: "after", session, runValidators: true },
  );

export const decreaseQuantity = (
  { locationType, locationId, batchId, quantity },
  session,
) =>
  Inventory.findOneAndUpdate(
    {
      locationType,
      locationId,
      batchId,
      quantity: { $gte: quantity },
    },
    { $inc: { quantity: -quantity } },
    { returnDocument: "after", session, runValidators: true },
  );

export const sumDrugQuantityAtLocation = (locationType, locationId, drugId) =>
  Inventory.aggregate([
    {
      $match: {
        locationType,
        locationId: new mongoose.Types.ObjectId(locationId),
        drugId: new mongoose.Types.ObjectId(drugId),
      },
    },
    { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
  ]);
