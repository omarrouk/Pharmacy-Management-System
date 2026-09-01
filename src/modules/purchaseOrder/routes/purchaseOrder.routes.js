import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as purchaseOrderController from "../controllers/purchaseOrder.controller.js";
import {
  listPurchaseOrdersQuerySchema,
  purchaseOrderIdParamSchema,
} from "../validations/purchaseOrder.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PURCHASE_ORDERS_READ),
  validate(listPurchaseOrdersQuerySchema, "query"),
  purchaseOrderController.listPurchaseOrders,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PURCHASE_ORDERS_READ),
  validate(purchaseOrderIdParamSchema, "params"),
  purchaseOrderController.getPurchaseOrder,
);

export default router;
