import { PurchaseOrder } from "../models/purchaseOrder.model.js";

export const createPurchaseOrder = (data, session) => {
  if (session) {
    return PurchaseOrder.create([data], { session }).then(([doc]) => doc);
  }

  return PurchaseOrder.create(data);
};

export const findPurchaseOrderById = (id) => PurchaseOrder.findById(id);

export const findPurchaseOrderByRequestId = (purchaseRequestId) =>
  PurchaseOrder.findOne({ purchaseRequestId });

export const listPurchaseOrders = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => PurchaseOrder.find(filter).sort(sort).skip(skip).limit(limit);

export const countPurchaseOrders = (filter = {}) =>
  PurchaseOrder.countDocuments(filter);

export const updatePurchaseOrderById = (id, data, session) =>
  PurchaseOrder.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
    session,
  });

export const countPurchaseOrdersForNumber = () => PurchaseOrder.countDocuments();
