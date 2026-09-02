import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as supplierReturnController from "../controllers/supplierReturn.controller.js";
import {
  createSupplierReturnSchema,
  listSupplierReturnsQuerySchema,
  supplierReturnIdParamSchema,
} from "../validations/supplierReturn.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.SUPPLIER_RETURNS_READ),
  validate(listSupplierReturnsQuerySchema, "query"),
  supplierReturnController.listSupplierReturns,
);

router.post(
  "/",
  authorize(PERMISSIONS.SUPPLIER_RETURNS_CREATE),
  validate(createSupplierReturnSchema),
  supplierReturnController.createSupplierReturn,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SUPPLIER_RETURNS_READ),
  validate(supplierReturnIdParamSchema, "params"),
  supplierReturnController.getSupplierReturn,
);

export default router;
