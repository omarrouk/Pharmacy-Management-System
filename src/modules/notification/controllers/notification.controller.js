import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import { runAllAlerts } from "../services/alert.service.js";
import * as notificationService from "../services/notification.service.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Notifications retrieved.", result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user);
  return success(res, "Unread count retrieved.", result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user,
    req.params.id,
  );
  return success(res, "Notification marked as read.", notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user);
  return success(res, "All notifications marked as read.", result);
});

export const runAlerts = asyncHandler(async (req, res) => {
  const result = await runAllAlerts();
  return success(res, "Alert scan completed.", result);
});
