import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as destructionController from "../controllers/destruction.controller.js";
import {
  createDestructionSchema,
  destructionIdParamSchema,
  listDestructionsQuerySchema,
} from "../validations/destruction.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.DESTRUCTIONS_READ),
  validate(listDestructionsQuerySchema, "query"),
  destructionController.listDestructions,
);

router.post(
  "/",
  authorize(PERMISSIONS.DESTRUCTIONS_CREATE),
  validate(createDestructionSchema),
  destructionController.createDestruction,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.DESTRUCTIONS_READ),
  validate(destructionIdParamSchema, "params"),
  destructionController.getDestruction,
);

export default router;
