import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as paymentMethodController from "../controllers/paymentMethod.controller.js";
import {
  createPaymentMethodSchema,
  listPaymentMethodsQuerySchema,
  paymentMethodIdParamSchema,
  updatePaymentMethodSchema,
} from "../validations/paymentMethod.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PAYMENT_METHODS_READ),
  validate(listPaymentMethodsQuerySchema, "query"),
  paymentMethodController.listPaymentMethods,
);

router.post(
  "/",
  authorize(PERMISSIONS.PAYMENT_METHODS_CREATE),
  validate(createPaymentMethodSchema),
  paymentMethodController.createPaymentMethod,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PAYMENT_METHODS_READ),
  validate(paymentMethodIdParamSchema, "params"),
  paymentMethodController.getPaymentMethod,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.PAYMENT_METHODS_UPDATE),
  validate(paymentMethodIdParamSchema, "params"),
  validate(updatePaymentMethodSchema),
  paymentMethodController.updatePaymentMethod,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.PAYMENT_METHODS_DEACTIVATE),
  validate(paymentMethodIdParamSchema, "params"),
  paymentMethodController.deactivatePaymentMethod,
);

export default router;
