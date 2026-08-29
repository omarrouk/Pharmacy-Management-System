import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as activeIngredientController from "../controllers/activeIngredient.controller.js";
import {
  activeIngredientIdParamSchema,
  createActiveIngredientSchema,
  listActiveIngredientsQuerySchema,
  updateActiveIngredientSchema,
} from "../validations/activeIngredient.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.ACTIVE_INGREDIENTS_READ),
  validate(listActiveIngredientsQuerySchema, "query"),
  activeIngredientController.listActiveIngredients,
);

router.post(
  "/",
  authorize(PERMISSIONS.ACTIVE_INGREDIENTS_CREATE),
  validate(createActiveIngredientSchema),
  activeIngredientController.createActiveIngredient,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.ACTIVE_INGREDIENTS_READ),
  validate(activeIngredientIdParamSchema, "params"),
  activeIngredientController.getActiveIngredient,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.ACTIVE_INGREDIENTS_UPDATE),
  validate(activeIngredientIdParamSchema, "params"),
  validate(updateActiveIngredientSchema),
  activeIngredientController.updateActiveIngredient,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.ACTIVE_INGREDIENTS_DEACTIVATE),
  validate(activeIngredientIdParamSchema, "params"),
  activeIngredientController.deactivateActiveIngredient,
);

export default router;
