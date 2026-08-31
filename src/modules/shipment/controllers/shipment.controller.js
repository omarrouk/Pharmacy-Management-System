import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as shipmentService from "../services/shipment.service.js";

export const createShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.createShipment(req.user, req.body);
  return success(res, "Shipment created.", shipment, 201);
});

export const listShipments = asyncHandler(async (req, res) => {
  const result = await shipmentService.listShipments(req.user, req.validatedQuery);
  return success(res, "Shipments retrieved.", result);
});

export const getShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentById(req.user, req.params.id);
  return success(res, "Shipment retrieved.", shipment);
});

export const sendShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.sendShipment(req.user, req.params.id);
  return success(res, "Shipment sent.", shipment);
});

export const receiveShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.receiveShipment(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Shipment received.", shipment);
});
