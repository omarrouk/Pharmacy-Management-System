import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as paymentMethodService from "../services/paymentMethod.service.js";

export const createPaymentMethod = asyncHandler(async (req, res) => {
  const method = await paymentMethodService.createPaymentMethod(req.body);
  return success(res, "Payment method created.", method, 201);
});

export const listPaymentMethods = asyncHandler(async (req, res) => {
  const result = await paymentMethodService.listPaymentMethods(req.validatedQuery);
  return success(res, "Payment methods retrieved.", result);
});

export const getPaymentMethod = asyncHandler(async (req, res) => {
  const method = await paymentMethodService.getPaymentMethodById(req.params.id);
  return success(res, "Payment method retrieved.", method);
});

export const updatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await paymentMethodService.updatePaymentMethod(
    req.params.id,
    req.body,
  );
  return success(res, "Payment method updated.", method);
});

export const deactivatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await paymentMethodService.deactivatePaymentMethod(req.params.id);
  return success(res, "Payment method deactivated.", method);
});
