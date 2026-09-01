import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as purchaseReceiptController from "../controllers/purchaseReceipt.controller.js";
import {
  createPurchaseReceiptSchema,
  listPurchaseReceiptsQuerySchema,
  purchaseReceiptIdParamSchema,
} from "../validations/purchaseReceipt.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PURCHASE_RECEIPTS_READ),
  validate(listPurchaseReceiptsQuerySchema, "query"),
  purchaseReceiptController.listPurchaseReceipts,
);

router.post(
  "/",
  authorize(PERMISSIONS.PURCHASE_RECEIPTS_CREATE),
  validate(createPurchaseReceiptSchema),
  purchaseReceiptController.receivePurchase,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PURCHASE_RECEIPTS_READ),
  validate(purchaseReceiptIdParamSchema, "params"),
  purchaseReceiptController.getPurchaseReceipt,
);

export default router;
