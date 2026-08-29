import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as manufacturerController from "../controllers/manufacturer.controller.js";
import {
  createManufacturerSchema,
  listManufacturersQuerySchema,
  manufacturerIdParamSchema,
  updateManufacturerSchema,
} from "../validations/manufacturer.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.MANUFACTURERS_READ),
  validate(listManufacturersQuerySchema, "query"),
  manufacturerController.listManufacturers,
);

router.post(
  "/",
  authorize(PERMISSIONS.MANUFACTURERS_CREATE),
  validate(createManufacturerSchema),
  manufacturerController.createManufacturer,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.MANUFACTURERS_READ),
  validate(manufacturerIdParamSchema, "params"),
  manufacturerController.getManufacturer,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.MANUFACTURERS_UPDATE),
  validate(manufacturerIdParamSchema, "params"),
  validate(updateManufacturerSchema),
  manufacturerController.updateManufacturer,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.MANUFACTURERS_DEACTIVATE),
  validate(manufacturerIdParamSchema, "params"),
  manufacturerController.deactivateManufacturer,
);

export default router;
