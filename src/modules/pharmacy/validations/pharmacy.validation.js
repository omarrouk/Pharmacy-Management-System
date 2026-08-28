import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createPharmacySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().alphanum().min(2).max(20).required(),
  address: Joi.string().trim().max(250).allow("").default(""),
  phone: Joi.string().trim().max(30).allow("").default(""),
  primaryWarehouseId: objectId.required(),
});

export const updatePharmacySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  code: Joi.string().trim().alphanum().min(2).max(20),
  address: Joi.string().trim().max(250).allow(""),
  phone: Joi.string().trim().max(30).allow(""),
  primaryWarehouseId: objectId,
  isActive: Joi.boolean(),
}).min(1);

export const pharmacyIdParamSchema = Joi.object({
  id: objectId.required().messages({
    "string.hex": "id must be a MongoDB ObjectId from create or list pharmacies.",
    "string.length":
      "id must be a MongoDB ObjectId from create or list pharmacies.",
    "any.required": "id is required in the URL.",
  }),
});

export const listPharmaciesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
