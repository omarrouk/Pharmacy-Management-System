import { AppError } from "../../../utils/appError.js";
import * as paymentMethodRepository from "../repositories/paymentMethod.repository.js";

const toPublic = (doc) => doc.toJSON();

export const createPaymentMethod = async (payload) => {
  const code = payload.code.toUpperCase();
  const existing = await paymentMethodRepository.findPaymentMethodByCode(code);

  if (existing) {
    throw new AppError("Payment method code is already in use.", 409, "CODE_IN_USE");
  }

  const method = await paymentMethodRepository.createPaymentMethod({
    name: payload.name,
    code,
  });

  return toPublic(method);
};

export const listPaymentMethods = async ({ page, limit }) => {
  const filter = {};
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    paymentMethodRepository.listPaymentMethods({ filter, skip, limit }),
    paymentMethodRepository.countPaymentMethods(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getPaymentMethodById = async (id) => {
  const method = await paymentMethodRepository.findPaymentMethodById(id);

  if (!method) {
    throw new AppError("Payment method was not found.", 404, "PAYMENT_METHOD_NOT_FOUND");
  }

  return toPublic(method);
};

export const assertActivePaymentMethod = async (id) => {
  const method = await paymentMethodRepository.findPaymentMethodById(id);

  if (!method || !method.isActive) {
    throw new AppError(
      "Payment method was not found or is inactive.",
      400,
      "INVALID_PAYMENT_METHOD",
    );
  }

  return method;
};

export const updatePaymentMethod = async (id, payload) => {
  const current = await paymentMethodRepository.findPaymentMethodById(id);

  if (!current) {
    throw new AppError("Payment method was not found.", 404, "PAYMENT_METHOD_NOT_FOUND");
  }

  const data = { ...payload };

  if (payload.code) {
    const code = payload.code.toUpperCase();
    const existing = await paymentMethodRepository.findPaymentMethodByCode(code);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError("Payment method code is already in use.", 409, "CODE_IN_USE");
    }

    data.code = code;
  }

  const updated = await paymentMethodRepository.updatePaymentMethodById(id, data);
  return toPublic(updated);
};

export const deactivatePaymentMethod = async (id) => {
  const method = await paymentMethodRepository.findPaymentMethodById(id);

  if (!method) {
    throw new AppError("Payment method was not found.", 404, "PAYMENT_METHOD_NOT_FOUND");
  }

  if (!method.isActive) {
    return toPublic(method);
  }

  const updated = await paymentMethodRepository.updatePaymentMethodById(id, {
    isActive: false,
  });

  return toPublic(updated);
};
