import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createPaymentMethodSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().min(2).max(20).required(),
});

export const updatePaymentMethodSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  code: Joi.string().trim().min(2).max(20),
  isActive: Joi.boolean(),
}).min(1);

export const paymentMethodIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listPaymentMethodsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});
