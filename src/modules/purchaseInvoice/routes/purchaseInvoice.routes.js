import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as purchaseInvoiceController from "../controllers/purchaseInvoice.controller.js";
import {
  listPurchaseInvoicesQuerySchema,
  purchaseInvoiceIdParamSchema,
} from "../validations/purchaseInvoice.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PURCHASE_INVOICES_READ),
  validate(listPurchaseInvoicesQuerySchema, "query"),
  purchaseInvoiceController.listPurchaseInvoices,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PURCHASE_INVOICES_READ),
  validate(purchaseInvoiceIdParamSchema, "params"),
  purchaseInvoiceController.getPurchaseInvoice,
);

export default router;
