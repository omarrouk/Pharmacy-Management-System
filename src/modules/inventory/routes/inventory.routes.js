import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as inventoryController from "../controllers/inventory.controller.js";
import {
  inventoryIdParamSchema,
  inventorySummaryQuerySchema,
  listInventoryQuerySchema,
} from "../validations/inventory.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/summary",
  authorize(PERMISSIONS.INVENTORY_READ),
  validate(inventorySummaryQuerySchema, "query"),
  inventoryController.getInventorySummary,
);

router.get(
  "/",
  authorize(PERMISSIONS.INVENTORY_READ),
  validate(listInventoryQuerySchema, "query"),
  inventoryController.listInventory,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.INVENTORY_READ),
  validate(inventoryIdParamSchema, "params"),
  inventoryController.getInventory,
);

export default router;
