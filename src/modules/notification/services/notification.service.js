import { sendSms } from "../../../adapters/sms/sms.adapter.js";
import { ROLES } from "../../../constants/roles.js";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from "../../../constants/notifications.js";
import { AppError } from "../../../utils/appError.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import * as notificationRepository from "../repositories/notification.repository.js";

const toPublic = (doc) => doc.toJSON();

const managerRolesForSms = new Set([
  ROLES.PHARMACY_MANAGER,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.PHARMACY_ADMIN,
  ROLES.SYSTEM_ADMIN,
]);

export const notifyUser = async ({
  user,
  type,
  title,
  message,
  dedupeKey = "",
  metadata = {},
  sendSmsAlert = false,
}) => {
  if (!user?.isActive) {
    return null;
  }

  if (dedupeKey) {
    const existing = await notificationRepository.findUnreadByUserAndDedupeKey(
      user._id,
      dedupeKey,
    );

    if (existing) {
      return toPublic(existing);
    }
  }

  const notification = await notificationRepository.createNotification({
    userId: user._id,
    type,
    title,
    message,
    status: NOTIFICATION_STATUSES.UNREAD,
    channel: NOTIFICATION_CHANNELS.IN_APP,
    dedupeKey,
    metadata,
  });

  if (sendSmsAlert && managerRolesForSms.has(user.role)) {
    await sendSms({
      to: user.email,
      message: `${title}: ${message}`,
    });

    await notificationRepository.createNotification({
      userId: user._id,
      type,
      title,
      message,
      status: NOTIFICATION_STATUSES.UNREAD,
      channel: NOTIFICATION_CHANNELS.SMS,
      dedupeKey: dedupeKey ? `${dedupeKey}:sms` : "",
      metadata,
    });
  }

  return toPublic(notification);
};

export const notifyUsers = async (users, payload) => {
  const results = [];

  for (const user of users) {
    const notification = await notifyUser({ user, ...payload });
    if (notification) {
      results.push(notification);
    }
  }

  return results;
};

export const listNotifications = async (actor, { page, limit, status, type }) => {
  const filter = { userId: actor._id };

  if (status) filter.status = status;
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [items, total, unreadTotal] = await Promise.all([
    notificationRepository.listNotifications({ filter, skip, limit }),
    notificationRepository.countNotifications(filter),
    notificationRepository.countNotifications({
      userId: actor._id,
      status: NOTIFICATION_STATUSES.UNREAD,
    }),
  ]);

  return {
    items: items.map(toPublic),
    page,
    limit,
    total,
    unreadTotal,
  };
};

export const getUnreadCount = async (actor) => {
  const unreadTotal = await notificationRepository.countNotifications({
    userId: actor._id,
    status: NOTIFICATION_STATUSES.UNREAD,
  });

  return { unreadTotal };
};

export const markAsRead = async (actor, id) => {
  const updated = await notificationRepository.markNotificationRead(id, actor._id);

  if (!updated) {
    throw new AppError("Notification was not found.", 404, "NOTIFICATION_NOT_FOUND");
  }

  return toPublic(updated);
};

export const markAllAsRead = async (actor) => {
  await notificationRepository.markAllNotificationsRead(actor._id);
  return { marked: true };
};

export const notifySupplyRequestUpdate = async ({ supplyRequest, title, message }) => {
  const pharmacyId =
    supplyRequest.destinationType === "pharmacy"
      ? supplyRequest.destinationId
      : supplyRequest.sourceType === "pharmacy"
        ? supplyRequest.sourceId
        : null;
  const warehouseId =
    supplyRequest.sourceType === "warehouse"
      ? supplyRequest.sourceId
      : supplyRequest.destinationType === "warehouse"
        ? supplyRequest.destinationId
        : null;

  const users = [];

  if (pharmacyId) {
    users.push(
      ...(await userRepository.findActiveUsersByRolesAndPharmacy(
        [ROLES.PHARMACY_MANAGER, ROLES.PHARMACY_ADMIN],
        pharmacyId,
      )),
    );
  }

  if (warehouseId) {
    users.push(
      ...(await userRepository.findActiveUsersByRolesAndWarehouse(
        [ROLES.WAREHOUSE_MANAGER],
        warehouseId,
      )),
    );
  }

  users.push(...(await userRepository.findActiveSystemAdmins()));

  const uniqueUsers = [...new Map(users.map((u) => [String(u._id), u])).values()];

  return notifyUsers(uniqueUsers, {
    type: NOTIFICATION_TYPES.SUPPLY_REQUEST,
    title,
    message,
    dedupeKey: `supply-request:${supplyRequest._id}:${title}`,
    metadata: { supplyRequestId: String(supplyRequest._id) },
  });
};

export const notifyShipmentUpdate = async ({ shipment, title, message }) => {
  const users = [];
  const pharmacyId =
    shipment.destinationType === "pharmacy"
      ? shipment.destinationId
      : shipment.sourceType === "pharmacy"
        ? shipment.sourceId
        : null;
  const warehouseId =
    shipment.sourceType === "warehouse"
      ? shipment.sourceId
      : shipment.destinationType === "warehouse"
        ? shipment.destinationId
        : null;

  if (pharmacyId) {
    users.push(
      ...(await userRepository.findActiveUsersByRolesAndPharmacy(
        [ROLES.PHARMACY_MANAGER, ROLES.PHARMACY_EMPLOYEE, ROLES.PHARMACIST],
        pharmacyId,
      )),
    );
  }

  if (warehouseId) {
    users.push(
      ...(await userRepository.findActiveUsersByRolesAndWarehouse(
        [ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_EMPLOYEE],
        warehouseId,
      )),
    );
  }

  const uniqueUsers = [...new Map(users.map((u) => [String(u._id), u])).values()];

  return notifyUsers(uniqueUsers, {
    type: NOTIFICATION_TYPES.SHIPMENT,
    title,
    message,
    dedupeKey: `shipment:${shipment._id}:${title}`,
    metadata: { shipmentId: String(shipment._id) },
  });
};

export const notifyPurchaseRequestUpdate = async ({
  purchaseRequest,
  title,
  message,
}) => {
  const warehouseId = purchaseRequest.warehouseId;
  const requestId = String(purchaseRequest._id ?? purchaseRequest.id);

  const users = await userRepository.findActiveUsersByRolesAndWarehouse(
    [ROLES.WAREHOUSE_MANAGER],
    warehouseId,
  );

  users.push(...(await userRepository.findActiveSystemAdmins()));

  const uniqueUsers = [...new Map(users.map((u) => [String(u._id), u])).values()];

  return notifyUsers(uniqueUsers, {
    type: NOTIFICATION_TYPES.PURCHASE_REQUEST,
    title,
    message,
    dedupeKey: `purchase-request:${requestId}:${title}`,
    metadata: { purchaseRequestId: requestId },
  });
};
