import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as customerReturnController from "../controllers/customerReturn.controller.js";
import {
  createCustomerReturnSchema,
  customerReturnIdParamSchema,
  listCustomerReturnsQuerySchema,
} from "../validations/customerReturn.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.CUSTOMER_RETURNS_READ),
  validate(listCustomerReturnsQuerySchema, "query"),
  customerReturnController.listCustomerReturns,
);

router.post(
  "/",
  authorize(PERMISSIONS.CUSTOMER_RETURNS_CREATE),
  validate(createCustomerReturnSchema),
  customerReturnController.createCustomerReturn,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.CUSTOMER_RETURNS_READ),
  validate(customerReturnIdParamSchema, "params"),
  customerReturnController.getCustomerReturn,
);

export default router;
