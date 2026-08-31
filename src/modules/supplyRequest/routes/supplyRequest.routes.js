import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as supplyRequestController from "../controllers/supplyRequest.controller.js";
import {
  approveSupplyRequestSchema,
  createPharmacySupplyRequestSchema,
  createWarehouseSupplyRequestSchema,
  listSupplyRequestsQuerySchema,
  rejectSupplyRequestSchema,
  supplyRequestIdParamSchema,
} from "../validations/supplyRequest.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_READ),
  validate(listSupplyRequestsQuerySchema, "query"),
  supplyRequestController.listSupplyRequests,
);

router.post(
  "/pharmacy",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_CREATE),
  validate(createPharmacySupplyRequestSchema),
  supplyRequestController.createPharmacySupplyRequest,
);

router.post(
  "/warehouse",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_CREATE),
  validate(createWarehouseSupplyRequestSchema),
  supplyRequestController.createWarehouseSupplyRequest,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_READ),
  validate(supplyRequestIdParamSchema, "params"),
  supplyRequestController.getSupplyRequest,
);

router.post(
  "/:id/approve",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_APPROVE),
  validate(supplyRequestIdParamSchema, "params"),
  validate(approveSupplyRequestSchema),
  supplyRequestController.approveSupplyRequest,
);

router.post(
  "/:id/reject",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_APPROVE),
  validate(supplyRequestIdParamSchema, "params"),
  validate(rejectSupplyRequestSchema),
  supplyRequestController.rejectSupplyRequest,
);

router.post(
  "/:id/cancel",
  authorize(PERMISSIONS.SUPPLY_REQUESTS_CANCEL),
  validate(supplyRequestIdParamSchema, "params"),
  supplyRequestController.cancelSupplyRequest,
);

export default router;
