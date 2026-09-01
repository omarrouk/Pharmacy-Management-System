import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const updateSellingPriceSchema = Joi.object({
  sellingPrice: Joi.number().min(0).required(),
});

export const listPriceHistoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const drugIdParamSchema = Joi.object({
  id: objectId.required(),
});
