import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as notificationController from "../controllers/notification.controller.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "../validations/notification.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.NOTIFICATIONS_READ),
  validate(listNotificationsQuerySchema, "query"),
  notificationController.listNotifications,
);

router.get(
  "/unread-count",
  authorize(PERMISSIONS.NOTIFICATIONS_READ),
  notificationController.getUnreadCount,
);

router.post(
  "/run-alerts",
  authorize(PERMISSIONS.NOTIFICATIONS_RUN_ALERTS),
  notificationController.runAlerts,
);

router.post(
  "/mark-all-read",
  authorize(PERMISSIONS.NOTIFICATIONS_UPDATE),
  notificationController.markAllAsRead,
);

router.patch(
  "/:id/read",
  authorize(PERMISSIONS.NOTIFICATIONS_UPDATE),
  validate(notificationIdParamSchema, "params"),
  notificationController.markAsRead,
);

export default router;
