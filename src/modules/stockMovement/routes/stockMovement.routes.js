import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as stockMovementController from "../controllers/stockMovement.controller.js";
import {
  createStockMovementSchema,
  listStockMovementsQuerySchema,
  stockMovementIdParamSchema,
} from "../validations/stockMovement.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.STOCK_MOVEMENTS_READ),
  validate(listStockMovementsQuerySchema, "query"),
  stockMovementController.listStockMovements,
);

router.post(
  "/",
  authorize(PERMISSIONS.STOCK_MOVEMENTS_CREATE),
  validate(createStockMovementSchema),
  stockMovementController.createStockMovement,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.STOCK_MOVEMENTS_READ),
  validate(stockMovementIdParamSchema, "params"),
  stockMovementController.getStockMovement,
);

export default router;
