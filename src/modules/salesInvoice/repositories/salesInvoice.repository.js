import { SalesInvoice } from "../models/salesInvoice.model.js";

export const createSalesInvoice = (data, session) => {
  if (session) {
    return SalesInvoice.create([data], { session }).then(([doc]) => doc);
  }

  return SalesInvoice.create(data);
};

export const findSalesInvoiceById = (id) => SalesInvoice.findById(id);

export const findSalesInvoiceByNumber = (invoiceNumber) =>
  SalesInvoice.findOne({ invoiceNumber });

export const listSalesInvoices = ({
  filter = {},
  skip = 0,
  limit = 20,
} = {}) =>
  SalesInvoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countSalesInvoices = (filter = {}) =>
  SalesInvoice.countDocuments(filter);

export const countSalesInvoicesWithPrefix = (prefix) =>
  SalesInvoice.countDocuments({
    invoiceNumber: { $regex: `^${prefix}` },
  });
