import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createPharmacyReturnSchema = Joi.object({
  pharmacyId: objectId.required(),
  reason: Joi.string().trim().min(3).max(500).required(),
  items: Joi.array()
    .items(
      Joi.object({
        drugId: objectId.required(),
        batchId: objectId.required(),
        sentQuantity: Joi.number().integer().min(1).required(),
      }),
    )
    .min(1)
    .required(),
});

export const receivePharmacyReturnSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        drugId: objectId.required(),
        batchId: objectId.required(),
        receivedQuantity: Joi.number().integer().min(0).required(),
      }),
    )
    .min(1)
    .required(),
});

export const listPharmacyReturnsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid("PREPARED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED"),
  pharmacyId: objectId,
  warehouseId: objectId,
});

export const pharmacyReturnIdParamSchema = Joi.object({
  id: objectId.required(),
});
