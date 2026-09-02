import Joi from "joi";
import {
  LOCATION_TYPE_VALUES,
  MOVEMENT_DIRECTION_VALUES,
} from "../../../constants/stockMovement.js";

const objectId = Joi.string().hex().length(24);

export const createInventoryAdjustmentSchema = Joi.object({
  locationType: Joi.string()
    .valid(...LOCATION_TYPE_VALUES)
    .required(),
  locationId: objectId.required(),
  reason: Joi.string().trim().min(3).max(500).required(),
  items: Joi.array()
    .items(
      Joi.object({
        drugId: objectId.required(),
        batchId: objectId.required(),
        quantity: Joi.number().integer().min(1).required(),
        direction: Joi.string()
          .valid(...MOVEMENT_DIRECTION_VALUES)
          .required(),
      }),
    )
    .min(1)
    .required(),
});

export const listInventoryAdjustmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  locationType: Joi.string().valid(...LOCATION_TYPE_VALUES),
  locationId: objectId,
}).custom((value, helpers) => {
  const hasType = Boolean(value.locationType);
  const hasId = Boolean(value.locationId);

  if (hasType !== hasId) {
    return helpers.error("any.custom", {
      message: "locationType and locationId must be provided together.",
    });
  }

  return value;
});

export const inventoryAdjustmentIdParamSchema = Joi.object({
  id: objectId.required(),
});
