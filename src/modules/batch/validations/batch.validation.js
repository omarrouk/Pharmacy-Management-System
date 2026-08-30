import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createBatchSchema = Joi.object({
  drugId: objectId.required(),
  batchNumber: Joi.string().trim().min(2).max(50).required(),
  expiryDate: Joi.date().iso().required(),
  source: Joi.string().trim().max(200).allow("").default(""),
  receiptReference: Joi.string().trim().max(200).allow("").default(""),
});

export const updateBatchSchema = Joi.object({
  source: Joi.string().trim().max(200).allow(""),
  receiptReference: Joi.string().trim().max(200).allow(""),
  isActive: Joi.boolean(),
}).min(1);

export const batchIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const drugIdParamSchema = Joi.object({
  drugId: objectId.required(),
});

export const listBatchesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  drugId: objectId,
  search: Joi.string().trim().max(50).allow(""),
});
