import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as inventoryAdjustmentController from "../controllers/inventoryAdjustment.controller.js";
import {
  createInventoryAdjustmentSchema,
  inventoryAdjustmentIdParamSchema,
  listInventoryAdjustmentsQuerySchema,
} from "../validations/inventoryAdjustment.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.INVENTORY_ADJUSTMENTS_READ),
  validate(listInventoryAdjustmentsQuerySchema, "query"),
  inventoryAdjustmentController.listInventoryAdjustments,
);

router.post(
  "/",
  authorize(PERMISSIONS.INVENTORY_ADJUSTMENTS_CREATE),
  validate(createInventoryAdjustmentSchema),
  inventoryAdjustmentController.createInventoryAdjustment,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.INVENTORY_ADJUSTMENTS_READ),
  validate(inventoryAdjustmentIdParamSchema, "params"),
  inventoryAdjustmentController.getInventoryAdjustment,
);

export default router;
