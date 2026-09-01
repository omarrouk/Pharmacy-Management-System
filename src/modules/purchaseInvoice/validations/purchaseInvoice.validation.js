import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const purchaseInvoiceIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listPurchaseInvoicesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  warehouseId: objectId,
  supplierId: objectId,
});
