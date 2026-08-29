import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createActiveIngredientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

export const updateActiveIngredientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  isActive: Joi.boolean(),
}).min(1);

export const activeIngredientIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listActiveIngredientsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
});
