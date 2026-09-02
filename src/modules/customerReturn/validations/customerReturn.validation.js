import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createCustomerReturnSchema = Joi.object({
  salesInvoiceId: objectId.required(),
  items: Joi.array()
    .items(
      Joi.object({
        drugId: objectId.required(),
        batchId: objectId.required(),
        quantity: Joi.number().integer().min(1).required(),
      }),
    )
    .min(1)
    .required(),
});

export const listCustomerReturnsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  pharmacyId: objectId,
  salesInvoiceId: objectId,
});

export const customerReturnIdParamSchema = Joi.object({
  id: objectId.required(),
});
