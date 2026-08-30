import Joi from "joi";
import { LOCATION_TYPE_VALUES } from "../../../constants/stockMovement.js";

const objectId = Joi.string().hex().length(24);

export const inventoryIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listInventoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  locationType: Joi.string()
    .valid(...LOCATION_TYPE_VALUES)
    .required(),
  locationId: objectId.required(),
  drugId: objectId,
  batchId: objectId,
});

export const inventorySummaryQuerySchema = Joi.object({
  locationType: Joi.string()
    .valid(...LOCATION_TYPE_VALUES)
    .required(),
  locationId: objectId.required(),
  drugId: objectId.required(),
});
