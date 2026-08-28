import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as pharmacyController from "../controllers/pharmacy.controller.js";
import {
  createPharmacySchema,
  listPharmaciesQuerySchema,
  pharmacyIdParamSchema,
  updatePharmacySchema,
} from "../validations/pharmacy.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PHARMACIES_READ),
  validate(listPharmaciesQuerySchema, "query"),
  pharmacyController.listPharmacies,
);

router.post(
  "/",
  authorize(PERMISSIONS.PHARMACIES_CREATE),
  validate(createPharmacySchema),
  pharmacyController.createPharmacy,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PHARMACIES_READ),
  validate(pharmacyIdParamSchema, "params"),
  pharmacyController.getPharmacy,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.PHARMACIES_UPDATE),
  validate(pharmacyIdParamSchema, "params"),
  validate(updatePharmacySchema),
  pharmacyController.updatePharmacy,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.PHARMACIES_DEACTIVATE),
  validate(pharmacyIdParamSchema, "params"),
  pharmacyController.deactivatePharmacy,
);

export default router;
