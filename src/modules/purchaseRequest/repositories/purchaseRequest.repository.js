import { PurchaseRequest } from "../models/purchaseRequest.model.js";

export const createPurchaseRequest = (data, session) => {
  if (session) {
    return PurchaseRequest.create([data], { session }).then(([doc]) => doc);
  }

  return PurchaseRequest.create(data);
};

export const findPurchaseRequestById = (id) => PurchaseRequest.findById(id);

export const listPurchaseRequests = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => PurchaseRequest.find(filter).sort(sort).skip(skip).limit(limit);

export const countPurchaseRequests = (filter = {}) =>
  PurchaseRequest.countDocuments(filter);

export const updatePurchaseRequestById = (id, data, session) =>
  PurchaseRequest.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
    session,
  });
