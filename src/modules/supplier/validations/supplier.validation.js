import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createSupplierSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  code: Joi.string().trim().min(2).max(20).required(),
  phone: Joi.string().trim().max(30).allow("").default(""),
  email: Joi.string().trim().email().allow("").default(""),
  address: Joi.string().trim().max(300).allow("").default(""),
});

export const updateSupplierSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  code: Joi.string().trim().min(2).max(20),
  phone: Joi.string().trim().max(30).allow(""),
  email: Joi.string().trim().email().allow(""),
  address: Joi.string().trim().max(300).allow(""),
  isActive: Joi.boolean(),
}).min(1);

export const supplierIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listSuppliersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(50).allow(""),
});
