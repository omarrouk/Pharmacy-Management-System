import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as userController from "../controllers/user.controller.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validations/user.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.USERS_READ),
  validate(listUsersQuerySchema, "query"),
  userController.listUsers,
);

router.post(
  "/",
  authorize(PERMISSIONS.USERS_CREATE),
  validate(createUserSchema),
  userController.createUser,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.USERS_READ),
  validate(userIdParamSchema, "params"),
  userController.getUser,
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.USERS_UPDATE),
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema),
  userController.updateUser,
);

router.post(
  "/:id/deactivate",
  authorize(PERMISSIONS.USERS_DEACTIVATE),
  validate(userIdParamSchema, "params"),
  userController.deactivateUser,
);

export default router;
