import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as pharmacyReturnController from "../controllers/pharmacyReturn.controller.js";
import {
  createPharmacyReturnSchema,
  listPharmacyReturnsQuerySchema,
  pharmacyReturnIdParamSchema,
  receivePharmacyReturnSchema,
} from "../validations/pharmacyReturn.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.PHARMACY_RETURNS_READ),
  validate(listPharmacyReturnsQuerySchema, "query"),
  pharmacyReturnController.listPharmacyReturns,
);

router.post(
  "/",
  authorize(PERMISSIONS.PHARMACY_RETURNS_CREATE),
  validate(createPharmacyReturnSchema),
  pharmacyReturnController.createPharmacyReturn,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.PHARMACY_RETURNS_READ),
  validate(pharmacyReturnIdParamSchema, "params"),
  pharmacyReturnController.getPharmacyReturn,
);

router.post(
  "/:id/send",
  authorize(PERMISSIONS.PHARMACY_RETURNS_SEND),
  validate(pharmacyReturnIdParamSchema, "params"),
  pharmacyReturnController.sendPharmacyReturn,
);

router.post(
  "/:id/receive",
  authorize(PERMISSIONS.PHARMACY_RETURNS_RECEIVE),
  validate(pharmacyReturnIdParamSchema, "params"),
  validate(receivePharmacyReturnSchema),
  pharmacyReturnController.receivePharmacyReturn,
);

export default router;
