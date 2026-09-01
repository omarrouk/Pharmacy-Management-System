import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as supplierController from "../controllers/supplier.controller.js";
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierIdParamSchema,
  updateSupplierSchema,
} from "../validations/supplier.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.SUPPLIERS_READ),
  validate(listSuppliersQuerySchema, "query"),
  supplierController.listSuppliers,
);

router.post(
  "/",
  authorize(PERMISSIONS.SUPPLIERS_CREATE),
  validate(createSupplierSchema),
  supplierController.createSupplier,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SUPPLIERS_READ),
  validate(supplierIdParamSchema, "params"),
  supplierController.getSupplier,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.SUPPLIERS_UPDATE),
  validate(supplierIdParamSchema, "params"),
  validate(updateSupplierSchema),
  supplierController.updateSupplier,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.SUPPLIERS_DEACTIVATE),
  validate(supplierIdParamSchema, "params"),
  supplierController.deactivateSupplier,
);

export default router;
