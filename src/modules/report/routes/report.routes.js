import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as reportController from "../controllers/report.controller.js";
import {
  bestSellingReportQuerySchema,
  expiryReportQuerySchema,
  inventoryReportQuerySchema,
  purchasesReportQuerySchema,
  salesReportQuerySchema,
  stockMovementsReportQuerySchema,
} from "../validations/report.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/sales",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(salesReportQuerySchema, "query"),
  reportController.salesReport,
);

router.get(
  "/best-selling-drugs",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(bestSellingReportQuerySchema, "query"),
  reportController.bestSellingReport,
);

router.get(
  "/purchases",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(purchasesReportQuerySchema, "query"),
  reportController.purchasesReport,
);

router.get(
  "/stock-movements",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(stockMovementsReportQuerySchema, "query"),
  reportController.stockMovementsReport,
);

router.get(
  "/inventory",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(inventoryReportQuerySchema, "query"),
  reportController.inventoryReport,
);

router.get(
  "/near-expiry",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(expiryReportQuerySchema, "query"),
  reportController.nearExpiryReport,
);

router.get(
  "/expired",
  authorize(PERMISSIONS.REPORTS_READ),
  validate(expiryReportQuerySchema, "query"),
  reportController.expiredReport,
);

export default router;
