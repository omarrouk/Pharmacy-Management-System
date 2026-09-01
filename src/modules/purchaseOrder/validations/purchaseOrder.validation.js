import Joi from "joi";
import { PURCHASE_ORDER_STATUS_VALUES } from "../../../constants/purchaseOrder.js";

const objectId = Joi.string().hex().length(24);

export const purchaseOrderIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listPurchaseOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...PURCHASE_ORDER_STATUS_VALUES),
  warehouseId: objectId,
  supplierId: objectId,
});
