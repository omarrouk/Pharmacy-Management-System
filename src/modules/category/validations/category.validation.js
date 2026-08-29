import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow("").default(""),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow(""),
  isActive: Joi.boolean(),
}).min(1);

export const categoryIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listCategoriesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
});
