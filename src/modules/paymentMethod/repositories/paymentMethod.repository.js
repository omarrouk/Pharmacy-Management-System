import { PaymentMethod } from "../models/paymentMethod.model.js";

export const createPaymentMethod = (data) => PaymentMethod.create(data);

export const findPaymentMethodById = (id) => PaymentMethod.findById(id);

export const findPaymentMethodByCode = (code) =>
  PaymentMethod.findOne({ code: code.toUpperCase() });

export const listPaymentMethods = ({ filter = {}, skip = 0, limit = 50 } = {}) =>
  PaymentMethod.find(filter).sort({ name: 1 }).skip(skip).limit(limit);

export const countPaymentMethods = (filter = {}) =>
  PaymentMethod.countDocuments(filter);

export const updatePaymentMethodById = (id, data) =>
  PaymentMethod.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
