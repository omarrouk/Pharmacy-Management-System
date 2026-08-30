import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as batchController from "../controllers/batch.controller.js";
import {
  batchIdParamSchema,
  createBatchSchema,
  drugIdParamSchema,
  listBatchesQuerySchema,
  updateBatchSchema,
} from "../validations/batch.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.BATCHES_READ),
  validate(listBatchesQuerySchema, "query"),
  batchController.listBatches,
);

router.get(
  "/fefo/:drugId",
  authorize(PERMISSIONS.BATCHES_READ),
  validate(drugIdParamSchema, "params"),
  batchController.listFefo,
);

router.post(
  "/",
  authorize(PERMISSIONS.BATCHES_CREATE),
  validate(createBatchSchema),
  batchController.createBatch,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.BATCHES_READ),
  validate(batchIdParamSchema, "params"),
  batchController.getBatch,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.BATCHES_UPDATE),
  validate(batchIdParamSchema, "params"),
  validate(updateBatchSchema),
  batchController.updateBatch,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.BATCHES_DEACTIVATE),
  validate(batchIdParamSchema, "params"),
  batchController.deactivateBatch,
);

export default router;
