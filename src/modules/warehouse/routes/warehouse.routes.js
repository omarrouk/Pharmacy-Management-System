import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as warehouseController from "../controllers/warehouse.controller.js";
import {
  createWarehouseSchema,
  listWarehousesQuerySchema,
  updateWarehouseSchema,
  warehouseIdParamSchema,
} from "../validations/warehouse.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.WAREHOUSES_READ),
  validate(listWarehousesQuerySchema, "query"),
  warehouseController.listWarehouses,
);

router.post(
  "/",
  authorize(PERMISSIONS.WAREHOUSES_CREATE),
  validate(createWarehouseSchema),
  warehouseController.createWarehouse,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.WAREHOUSES_READ),
  validate(warehouseIdParamSchema, "params"),
  warehouseController.getWarehouse,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  validate(warehouseIdParamSchema, "params"),
  validate(updateWarehouseSchema),
  warehouseController.updateWarehouse,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.WAREHOUSES_DEACTIVATE),
  validate(warehouseIdParamSchema, "params"),
  warehouseController.deactivateWarehouse,
);

export default router;
