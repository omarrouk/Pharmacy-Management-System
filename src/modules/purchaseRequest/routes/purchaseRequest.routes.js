import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as purchaseRequestController from "../controllers/purchaseRequest.controller.js";
import {
  approvePurchaseRequestSchema,
  createPurchaseRequestSchema,
  listPurchaseRequestsQuerySchema,
  purchaseRequestIdParamSchema,
  rejectPurchaseRequestSchema,
} from "../validations/purchaseRequest.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PURCHASE_REQUESTS_READ),
  validate(listPurchaseRequestsQuerySchema, "query"),
  purchaseRequestController.listPurchaseRequests,
);

router.post(
  "/",
  authorize(PERMISSIONS.PURCHASE_REQUESTS_CREATE),
  validate(createPurchaseRequestSchema),
  purchaseRequestController.createPurchaseRequest,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PURCHASE_REQUESTS_READ),
  validate(purchaseRequestIdParamSchema, "params"),
  purchaseRequestController.getPurchaseRequest,
);

router.post(
  "/:id/approve",
  authorize(PERMISSIONS.PURCHASE_REQUESTS_APPROVE),
  validate(purchaseRequestIdParamSchema, "params"),
  validate(approvePurchaseRequestSchema),
  purchaseRequestController.approvePurchaseRequest,
);

router.post(
  "/:id/reject",
  authorize(PERMISSIONS.PURCHASE_REQUESTS_APPROVE),
  validate(purchaseRequestIdParamSchema, "params"),
  validate(rejectPurchaseRequestSchema),
  purchaseRequestController.rejectPurchaseRequest,
);

router.post(
  "/:id/cancel",
  authorize(PERMISSIONS.PURCHASE_REQUESTS_CANCEL),
  validate(purchaseRequestIdParamSchema, "params"),
  purchaseRequestController.cancelPurchaseRequest,
);

export default router;
