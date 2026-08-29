import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as categoryController from "../controllers/category.controller.js";
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "../validations/category.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.CATEGORIES_READ),
  validate(listCategoriesQuerySchema, "query"),
  categoryController.listCategories,
);

router.post(
  "/",
  authorize(PERMISSIONS.CATEGORIES_CREATE),
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.CATEGORIES_READ),
  validate(categoryIdParamSchema, "params"),
  categoryController.getCategory,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.CATEGORIES_UPDATE),
  validate(categoryIdParamSchema, "params"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.CATEGORIES_DEACTIVATE),
  validate(categoryIdParamSchema, "params"),
  categoryController.deactivateCategory,
);

export default router;
