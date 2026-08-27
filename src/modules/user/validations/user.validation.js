import Joi from "joi";
import { ROLE_VALUES } from "../../../constants/roles.js";

const objectId = Joi.string().hex().length(24);

export const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string()
    .valid(...ROLE_VALUES)
    .required(),
  pharmacyIds: Joi.array().items(objectId).default([]),
  warehouseIds: Joi.array().items(objectId).default([]),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().email(),
  password: Joi.string().min(8).max(72),
  role: Joi.string().valid(...ROLE_VALUES),
  isActive: Joi.boolean(),
  pharmacyIds: Joi.array().items(objectId),
  warehouseIds: Joi.array().items(objectId),
}).min(1);

export const userIdParamSchema = Joi.object({
  id: objectId.required().messages({
    "string.hex": "id must be a MongoDB ObjectId from create or list users.",
    "string.length": "id must be a MongoDB ObjectId from create or list users.",
    "any.required": "id is required in the URL.",
  }),
});

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
