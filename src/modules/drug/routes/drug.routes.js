import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as drugController from "../controllers/drug.controller.js";
import {
  createDrugSchema,
  drugIdParamSchema,
  listDrugsQuerySchema,
  updateDrugSchema,
} from "../validations/drug.validation.js";
import Joi from "joi";

const router = Router();

const activeIngredientIdParamSchema = Joi.object({
  activeIngredientId: Joi.string().hex().length(24).required(),
});

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.DRUGS_READ),
  validate(listDrugsQuerySchema, "query"),
  drugController.listDrugs,
);

router.get(
  "/by-active-ingredient/:activeIngredientId",
  authorize(PERMISSIONS.DRUGS_READ),
  validate(activeIngredientIdParamSchema, "params"),
  drugController.listAlternatives,
);

router.post(
  "/",
  authorize(PERMISSIONS.DRUGS_CREATE),
  validate(createDrugSchema),
  drugController.createDrug,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.DRUGS_READ),
  validate(drugIdParamSchema, "params"),
  drugController.getDrug,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.DRUGS_UPDATE),
  validate(drugIdParamSchema, "params"),
  validate(updateDrugSchema),
  drugController.updateDrug,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.DRUGS_DEACTIVATE),
  validate(drugIdParamSchema, "params"),
  drugController.deactivateDrug,
);

export default router;
