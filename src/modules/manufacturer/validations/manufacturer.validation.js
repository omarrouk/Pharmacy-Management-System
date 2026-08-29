import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createManufacturerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  country: Joi.string().trim().max(100).allow("").default(""),
});

export const updateManufacturerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  country: Joi.string().trim().max(100).allow(""),
  isActive: Joi.boolean(),
}).min(1);

export const manufacturerIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listManufacturersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
});
