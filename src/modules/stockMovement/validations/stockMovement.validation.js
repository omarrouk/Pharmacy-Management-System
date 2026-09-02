import Joi from "joi";
import { DOMAIN_MOVEMENT_TYPES } from "../../../constants/restrictedMovements.js";
import {
  LOCATION_TYPE_VALUES,
  MOVEMENT_DIRECTION_VALUES,
  MOVEMENT_TYPE_VALUES,
} from "../../../constants/stockMovement.js";

const objectId = Joi.string().hex().length(24);

export const createStockMovementSchema = Joi.object({
  movementType: Joi.string()
    .valid(...MOVEMENT_TYPE_VALUES)
    .required(),
  direction: Joi.string()
    .valid(...MOVEMENT_DIRECTION_VALUES)
    .required(),
  drugId: objectId.required(),
  batchId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
  locationType: Joi.string()
    .valid(...LOCATION_TYPE_VALUES)
    .required(),
  locationId: objectId.required(),
  counterpartyLocationType: Joi.string()
    .valid(...LOCATION_TYPE_VALUES)
    .allow(null),
  counterpartyLocationId: objectId.allow(null),
  reference: Joi.string().trim().max(200).allow("").default(""),
  reason: Joi.string().trim().max(500).allow("").default(""),
}).custom((value, helpers) => {
  if (DOMAIN_MOVEMENT_TYPES.includes(value.movementType)) {
    return helpers.error("any.custom", {
      message: "Use the dedicated endpoint for this movement type.",
    });
  }

  const hasCounterpartyType = Boolean(value.counterpartyLocationType);
  const hasCounterpartyId = Boolean(value.counterpartyLocationId);

  if (hasCounterpartyType !== hasCounterpartyId) {
    return helpers.error("any.custom", {
      message:
        "counterpartyLocationType and counterpartyLocationId must be provided together.",
    });
  }

  return value;
});

export const stockMovementIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listStockMovementsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  locationType: Joi.string().valid(...LOCATION_TYPE_VALUES),
  locationId: objectId,
  drugId: objectId,
  batchId: objectId,
  movementType: Joi.string().valid(...MOVEMENT_TYPE_VALUES),
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
