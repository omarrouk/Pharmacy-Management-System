import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createSupplierReturnSchema = Joi.object({
  warehouseId: objectId.required(),
  supplierId: objectId.required(),
  reason: Joi.string().trim().min(3).max(500).required(),
  items: Joi.array()
    .items(
      Joi.object({
        drugId: objectId.required(),
        batchId: objectId.required(),
        quantity: Joi.number().integer().min(1).required(),
      }),
    )
    .min(1)
    .required(),
});

export const listSupplierReturnsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  warehouseId: objectId,
  supplierId: objectId,
});

export const supplierReturnIdParamSchema = Joi.object({
  id: objectId.required(),
});
