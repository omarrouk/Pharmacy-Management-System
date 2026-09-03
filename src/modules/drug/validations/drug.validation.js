import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createDrugSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  activeIngredientIds: Joi.array().items(objectId).min(1).required(),
  categoryId: objectId.required(),
  manufacturerId: objectId.required(),
  dosageForm: Joi.string().trim().min(2).max(50).required(),
  concentration: Joi.string().trim().min(1).max(50).required(),
  barcode: Joi.string().trim().min(3).max(50).required(),
  sellingPrice: Joi.number().min(0).required(),
  minimumStockThreshold: Joi.number().min(0).default(0),
});

export const updateDrugSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  activeIngredientIds: Joi.array().items(objectId).min(1),
  categoryId: objectId,
  manufacturerId: objectId,
  dosageForm: Joi.string().trim().min(2).max(50),
  concentration: Joi.string().trim().min(1).max(50),
  barcode: Joi.string().trim().min(3).max(50),
  minimumStockThreshold: Joi.number().min(0),
  isActive: Joi.boolean(),
}).min(1);

export const drugIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const activeIngredientIdParamSchema = Joi.object({
  activeIngredientId: objectId.required(),
});

export const listDrugsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
  categoryId: objectId,
  activeIngredientId: objectId,
});

export const listAlternativesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
