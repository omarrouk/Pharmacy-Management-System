import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as shipmentController from "../controllers/shipment.controller.js";
import {
  createShipmentSchema,
  listShipmentsQuerySchema,
  receiveShipmentSchema,
  shipmentIdParamSchema,
} from "../validations/shipment.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.SHIPMENTS_READ),
  validate(listShipmentsQuerySchema, "query"),
  shipmentController.listShipments,
);

router.post(
  "/",
  authorize(PERMISSIONS.SHIPMENTS_CREATE),
  validate(createShipmentSchema),
  shipmentController.createShipment,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SHIPMENTS_READ),
  validate(shipmentIdParamSchema, "params"),
  shipmentController.getShipment,
);

router.post(
  "/:id/send",
  authorize(PERMISSIONS.SHIPMENTS_SEND),
  validate(shipmentIdParamSchema, "params"),
  shipmentController.sendShipment,
);

router.post(
  "/:id/receive",
  authorize(PERMISSIONS.SHIPMENTS_RECEIVE),
  validate(shipmentIdParamSchema, "params"),
  validate(receiveShipmentSchema),
  shipmentController.receiveShipment,
);

export default router;
