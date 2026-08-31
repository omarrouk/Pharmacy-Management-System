import mongoose from "mongoose";
import { Shipment } from "../models/shipment.model.js";

export const createShipment = (data, session) => {
  if (session) {
    return Shipment.create([data], { session }).then(([doc]) => doc);
  }

  return Shipment.create(data);
};

export const findShipmentById = (id) => Shipment.findById(id);

export const listShipments = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => Shipment.find(filter).sort(sort).skip(skip).limit(limit);

export const countShipments = (filter = {}) => Shipment.countDocuments(filter);

export const updateShipmentById = (id, data, session) =>
  Shipment.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
    session,
  });

export const sumCommittedQuantitiesBySupplyRequest = (supplyRequestId) =>
  Shipment.aggregate([
    {
      $match: {
        supplyRequestId: new mongoose.Types.ObjectId(supplyRequestId),
        status: { $in: ["PREPARED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED"] },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.drugId",
        totalCommitted: { $sum: "$items.sentQuantity" },
      },
    },
  ]);
