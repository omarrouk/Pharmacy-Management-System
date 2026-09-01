import { PurchaseInvoice } from "../models/purchaseInvoice.model.js";

export const createPurchaseInvoice = (data, session) => {
  if (session) {
    return PurchaseInvoice.create([data], { session }).then(([doc]) => doc);
  }

  return PurchaseInvoice.create(data);
};

export const findPurchaseInvoiceById = (id) => PurchaseInvoice.findById(id);

export const listPurchaseInvoices = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => PurchaseInvoice.find(filter).sort(sort).skip(skip).limit(limit);

export const countPurchaseInvoices = (filter = {}) =>
  PurchaseInvoice.countDocuments(filter);
