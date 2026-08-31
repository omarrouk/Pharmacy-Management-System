import Joi from "joi";
import {
  SUPPLY_REQUEST_STATUS_VALUES,
  SUPPLY_REQUEST_TYPE_VALUES,
} from "../../../constants/supplyRequest.js";

const objectId = Joi.string().hex().length(24);

const supplyItemSchema = Joi.object({
  drugId: objectId.required(),
  requestedQuantity: Joi.number().integer().min(1).required(),
});

const approvalItemSchema = Joi.object({
  drugId: objectId.required(),
  approvedQuantity: Joi.number().integer().min(0).required(),
  itemReason: Joi.string().trim().max(500).allow("").default(""),
});

export const createPharmacySupplyRequestSchema = Joi.object({
  pharmacyId: objectId.required(),
  items: Joi.array().items(supplyItemSchema).min(1).required(),
});

export const createWarehouseSupplyRequestSchema = Joi.object({
  sourceWarehouseId: objectId.required(),
  destinationWarehouseId: objectId.required(),
  items: Joi.array().items(supplyItemSchema).min(1).required(),
});

export const approveSupplyRequestSchema = Joi.object({
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

export const rejectSupplyRequestSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(3).max(500).required(),
});

export const supplyRequestIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listSupplyRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...SUPPLY_REQUEST_STATUS_VALUES),
  requestType: Joi.string().valid(...SUPPLY_REQUEST_TYPE_VALUES),
});
