import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const receiptItemSchema = Joi.object({
  drugId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
  unitCost: Joi.number().min(0).required(),
  batchId: objectId,
  batchNumber: Joi.string().trim().min(2).max(50),
  expiryDate: Joi.date().iso(),
})
  .xor("batchId", "batchNumber")
  .with("batchNumber", "expiryDate")
  .messages({
    "object.missing": "Provide either batchId or both batchNumber and expiryDate.",
  });

export const createPurchaseReceiptSchema = Joi.object({
  purchaseOrderId: objectId.required(),
  invoiceNumber: Joi.string().trim().min(2).max(100).required(),
  items: Joi.array().items(receiptItemSchema).min(1).required(),
});

export const purchaseReceiptIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listPurchaseReceiptsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  purchaseOrderId: objectId,
  warehouseId: objectId,
});
