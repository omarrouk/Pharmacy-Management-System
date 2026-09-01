import Joi from "joi";
import { PURCHASE_REQUEST_STATUS_VALUES } from "../../../constants/purchaseRequest.js";

const objectId = Joi.string().hex().length(24);

const requestItemSchema = Joi.object({
  drugId: objectId.required(),
  requestedQuantity: Joi.number().integer().min(1).required(),
  unitCost: Joi.number().min(0),
});

const approvalItemSchema = Joi.object({
  drugId: objectId.required(),
  approvedQuantity: Joi.number().integer().min(0).required(),
  unitCost: Joi.number().min(0).required(),
  itemReason: Joi.string().trim().max(500).allow("").default(""),
});

export const createPurchaseRequestSchema = Joi.object({
  warehouseId: objectId.required(),
  supplierId: objectId.required(),
  items: Joi.array().items(requestItemSchema).min(1).required(),
});

export const approvePurchaseRequestSchema = Joi.object({
  items: Joi.array().items(approvalItemSchema).min(1).required(),
}).custom((value, helpers) => {
  const needsReason = value.items.some(
    (item) => item.approvedQuantity === 0 && !item.itemReason?.trim(),
  );

  if (needsReason) {
    return helpers.error("any.custom", {
      message: "itemReason is required when approvedQuantity is 0.",
    });
  }

  return value;
});

export const rejectPurchaseRequestSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(3).max(500).required(),
});

export const purchaseRequestIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listPurchaseRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...PURCHASE_REQUEST_STATUS_VALUES),
  warehouseId: objectId,
  supplierId: objectId,
});
