import { Notification } from "../models/notification.model.js";
import { NOTIFICATION_STATUSES } from "../../../constants/notifications.js";

export const createNotification = (data, session) => {
  if (session) {
    return Notification.create([data], { session }).then(([doc]) => doc);
  }

  return Notification.create(data);
};

export const findNotificationById = (id) => Notification.findById(id);

export const findUnreadByUserAndDedupeKey = (userId, dedupeKey) =>
  Notification.findOne({
    userId,
    dedupeKey,
    status: NOTIFICATION_STATUSES.UNREAD,
  });

export const listNotifications = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countNotifications = (filter = {}) => Notification.countDocuments(filter);

export const markNotificationRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, userId },
    { status: NOTIFICATION_STATUSES.READ },
    { returnDocument: "after" },
  );

export const markAllNotificationsRead = (userId) =>
  Notification.updateMany(
    { userId, status: NOTIFICATION_STATUSES.UNREAD },
    { status: NOTIFICATION_STATUSES.READ },
  );
