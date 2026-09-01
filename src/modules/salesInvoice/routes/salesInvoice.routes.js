import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as salesInvoiceController from "../controllers/salesInvoice.controller.js";
import {
  createSalesInvoiceSchema,
  listSalesInvoicesQuerySchema,
  salesInvoiceIdParamSchema,
} from "../validations/salesInvoice.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.SALES_INVOICES_READ),
  validate(listSalesInvoicesQuerySchema, "query"),
  salesInvoiceController.listSalesInvoices,
);

router.post(
  "/",
  authorize(PERMISSIONS.SALES_INVOICES_CREATE),
  validate(createSalesInvoiceSchema),
  salesInvoiceController.createSalesInvoice,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SALES_INVOICES_READ),
  validate(salesInvoiceIdParamSchema, "params"),
  salesInvoiceController.getSalesInvoice,
);

export default router;
