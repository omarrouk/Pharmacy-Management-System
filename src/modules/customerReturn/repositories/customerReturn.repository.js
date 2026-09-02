import mongoose from "mongoose";
import { CustomerReturn } from "../models/customerReturn.model.js";

export const createCustomerReturn = (data, session) => {
  if (session) {
    return CustomerReturn.create([data], { session }).then(([doc]) => doc);
  }

  return CustomerReturn.create(data);
};

export const findCustomerReturnById = (id) => CustomerReturn.findById(id);

export const listCustomerReturns = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  CustomerReturn.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countCustomerReturns = (filter = {}) =>
  CustomerReturn.countDocuments(filter);

export const countCustomerReturnsWithPrefix = (prefix) =>
  CustomerReturn.countDocuments({
    returnNumber: { $regex: `^${prefix}` },
  });

export const sumReturnedQuantitiesByInvoice = (salesInvoiceId) =>
  CustomerReturn.aggregate([
    {
      $match: {
        salesInvoiceId: new mongoose.Types.ObjectId(salesInvoiceId),
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          drugId: "$items.drugId",
          batchId: "$items.batchId",
        },
        totalReturned: { $sum: "$items.quantity" },
      },
    },
  ]);
