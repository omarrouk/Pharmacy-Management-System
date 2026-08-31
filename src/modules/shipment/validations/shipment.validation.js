import Joi from "joi";
import { SHIPMENT_STATUS_VALUES } from "../../../constants/shipment.js";

const objectId = Joi.string().hex().length(24);

const shipmentItemSchema = Joi.object({
  drugId: objectId.required(),
  batchId: objectId.required(),
  sentQuantity: Joi.number().integer().min(1).required(),
});

const receiveItemSchema = Joi.object({
  drugId: objectId.required(),
  batchId: objectId.required(),
  receivedQuantity: Joi.number().integer().min(0).required(),
});

export const createShipmentSchema = Joi.object({
  supplyRequestId: objectId.required(),
  items: Joi.array().items(shipmentItemSchema).min(1).required(),
});

export const receiveShipmentSchema = Joi.object({
  items: Joi.array().items(receiveItemSchema).min(1).required(),
});

export const shipmentIdParamSchema = Joi.object({
  id: objectId.required(),
});

export const listShipmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...SHIPMENT_STATUS_VALUES),
  supplyRequestId: objectId,
});
