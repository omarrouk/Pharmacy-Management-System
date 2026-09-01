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

export const listPharmacyInventoryFefo = (pharmacyId, drugId) =>
  Inventory.aggregate([
    {
      $match: {
        locationType: "pharmacy",
        locationId: new mongoose.Types.ObjectId(pharmacyId),
        drugId: new mongoose.Types.ObjectId(drugId),
        quantity: { $gt: 0 },
      },
    },
    {
      $lookup: {
        from: "batches",
        localField: "batchId",
        foreignField: "_id",
        as: "batch",
      },
    },
    { $unwind: "$batch" },
    { $match: { "batch.isActive": true } },
    { $sort: { "batch.expiryDate": 1 } },
    {
      $project: {
        batchId: 1,
        quantity: 1,
        expiryDate: "$batch.expiryDate",
      },
    },
  ]);
