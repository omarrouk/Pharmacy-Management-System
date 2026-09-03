import Joi from "joi";
import {
  LOCATION_TYPE_VALUES,
  MOVEMENT_TYPE_VALUES,
} from "../../../constants/stockMovement.js";

const objectId = Joi.string().hex().length(24);

const baseFilters = {
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref("from")),
  pharmacyId: objectId,
  warehouseId: objectId,
  locationType: Joi.string().valid(...LOCATION_TYPE_VALUES),
  locationId: objectId,
  drugId: objectId,
  categoryId: objectId,
  supplierId: objectId,
  userId: objectId,
};

export const salesReportQuerySchema = Joi.object({
  from: baseFilters.from,
  to: baseFilters.to,
  pharmacyId: baseFilters.pharmacyId,
  drugId: baseFilters.drugId,
  categoryId: baseFilters.categoryId,
  userId: baseFilters.userId,
});

export const bestSellingReportQuerySchema = Joi.object({
  from: baseFilters.from,
  to: baseFilters.to,
  pharmacyId: baseFilters.pharmacyId,
  drugId: baseFilters.drugId,
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const purchasesReportQuerySchema = Joi.object({
  from: baseFilters.from,
  to: baseFilters.to,
  warehouseId: baseFilters.warehouseId,
  supplierId: baseFilters.supplierId,
  drugId: baseFilters.drugId,
  userId: baseFilters.userId,
});

export const stockMovementsReportQuerySchema = Joi.object({
  from: baseFilters.from,
  to: baseFilters.to,
  locationType: baseFilters.locationType,
  locationId: baseFilters.locationId,
  drugId: baseFilters.drugId,
  userId: baseFilters.userId,
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

export const inventoryReportQuerySchema = Joi.object({
  locationType: baseFilters.locationType,
  locationId: baseFilters.locationId,
  drugId: baseFilters.drugId,
  categoryId: baseFilters.categoryId,
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

export const expiryReportQuerySchema = Joi.object({
  locationType: baseFilters.locationType,
  locationId: baseFilters.locationId,
  drugId: baseFilters.drugId,
  days: Joi.number().integer().min(1).max(365).default(30),
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
