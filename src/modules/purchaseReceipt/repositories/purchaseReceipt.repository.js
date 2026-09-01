import { PurchaseReceipt } from "../models/purchaseReceipt.model.js";

export const createPurchaseReceipt = (data, session) => {
  if (session) {
    return PurchaseReceipt.create([data], { session }).then(([doc]) => doc);
  }

  return PurchaseReceipt.create(data);
};

export const findPurchaseReceiptById = (id) => PurchaseReceipt.findById(id);

export const findPurchaseReceiptByInvoiceNumber = (invoiceNumber) =>
  PurchaseReceipt.findOne({ invoiceNumber });

export const listPurchaseReceipts = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => PurchaseReceipt.find(filter).sort(sort).skip(skip).limit(limit);

export const countPurchaseReceipts = (filter = {}) =>
  PurchaseReceipt.countDocuments(filter);
