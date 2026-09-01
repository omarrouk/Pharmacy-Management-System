import Joi from "joi";
import { DISCOUNT_TYPE_VALUES } from "../../../constants/sales.js";

const objectId = Joi.string().hex().length(24);

const discountFields = {
  discountType: Joi.string()
    .valid(...DISCOUNT_TYPE_VALUES)
    .when("discountValue", {
      is: Joi.number().greater(0),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  discountValue: Joi.number().min(0).default(0),
};

export const createSalesInvoiceSchema = Joi.object({
  pharmacyId: objectId.required(),
  paymentMethodId: objectId.required(),
  customer: Joi.object({
    name: Joi.string().trim().max(120).allow(""),
    nationalId: Joi.string().trim().max(50).allow(""),
  }).default({}),
  items: Joi.array()
    .items(
      Joi.object({
        drugId: objectId.required(),
        quantity: Joi.number().integer().min(1).required(),
        batchId: objectId,
        ...discountFields,
      }),
    )
    .min(1)
    .required(),
});

export const listSalesInvoicesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  pharmacyId: objectId,
});

export const salesInvoiceIdParamSchema = Joi.object({
  id: objectId.required(),
});
