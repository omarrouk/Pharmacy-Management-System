import Joi from "joi";
import { NOTIFICATION_STATUS_VALUES, NOTIFICATION_TYPE_VALUES } from "../../../constants/notifications.js";

const objectId = Joi.string().hex().length(24);

export const listNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...NOTIFICATION_STATUS_VALUES),
  type: Joi.string().valid(...NOTIFICATION_TYPE_VALUES),
});

export const notificationIdParamSchema = Joi.object({
  id: objectId.required(),
});
