import { ROLES } from "../../../constants/roles.js";
import {
  DEFAULT_EXPIRY_ALERT_DAYS,
  NOTIFICATION_TYPES,
} from "../../../constants/notifications.js";
import { LOCATION_TYPES } from "../../../constants/stockMovement.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as inventoryRepository from "../../inventory/repositories/inventory.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import { notifyUsers } from "./notification.service.js";

const getLocationRecipients = async (locationType, locationId) => {
  if (locationType === LOCATION_TYPES.PHARMACY) {
    const users = await userRepository.findActiveUsersByRolesAndPharmacy(
      [ROLES.PHARMACY_MANAGER, ROLES.PHARMACY_ADMIN],
      locationId,
    );

    return [...users, ...(await userRepository.findActiveSystemAdmins())];
  }

  const users = await userRepository.findActiveUsersByRolesAndWarehouse(
    [ROLES.WAREHOUSE_MANAGER],
    locationId,
  );

  return [...users, ...(await userRepository.findActiveSystemAdmins())];
};

const uniqueUsers = (users) =>
  [...new Map(users.map((user) => [String(user._id), user])).values()];

export const checkLowStockAtLocation = async (locationType, locationId, drugId) => {
  const drug = await drugRepository.findDrugById(drugId);

  if (!drug || !drug.isActive || drug.minimumStockThreshold <= 0) {
    return [];
  }

  const totals = await inventoryRepository.sumDrugQuantityAtLocation(
    locationType,
    locationId,
    drugId,
  );
  const currentQty = totals[0]?.totalQuantity ?? 0;

  if (currentQty > drug.minimumStockThreshold) {
    return [];
  }

  const users = uniqueUsers(await getLocationRecipients(locationType, locationId));
  const dedupeKey = `low-stock:${locationType}:${locationId}:${drugId}`;

  return notifyUsers(users, {
    type: NOTIFICATION_TYPES.LOW_STOCK,
    title: "Low stock alert",
    message: `${drug.name} is at or below threshold (${currentQty}/${drug.minimumStockThreshold}) at ${locationType} ${locationId}.`,
    dedupeKey,
    metadata: {
      locationType,
      locationId: String(locationId),
      drugId: String(drugId),
      currentQty,
      threshold: drug.minimumStockThreshold,
    },
    sendSmsAlert: true,
  });
};

const notifyForBatchAtLocations = async ({
  batch,
  drug,
  type,
  title,
  messagePrefix,
  dedupePrefix,
}) => {
  const rows = await inventoryRepository.listInventory({
    filter: { batchId: batch._id, quantity: { $gt: 0 } },
    limit: 500,
  });

  const notifications = [];

  for (const row of rows) {
    const users = uniqueUsers(
      await getLocationRecipients(row.locationType, String(row.locationId)),
    );
    const dedupeKey = `${dedupePrefix}:${row.locationType}:${row.locationId}:${batch._id}`;

    const created = await notifyUsers(users, {
      type,
      title,
      message: `${messagePrefix} ${drug.name} batch ${batch.batchNumber} at ${row.locationType} (qty ${row.quantity}).`,
      dedupeKey,
      metadata: {
        batchId: String(batch._id),
        drugId: String(drug._id),
        locationType: row.locationType,
        locationId: String(row.locationId),
        expiryDate: batch.expiryDate,
      },
      sendSmsAlert: type === NOTIFICATION_TYPES.EXPIRED,
    });

    notifications.push(...created);
  }

  return notifications;
};

export const runExpiryAlerts = async () => {
  const now = new Date();
  const nearExpiryBefore = new Date(now);
  nearExpiryBefore.setDate(nearExpiryBefore.getDate() + DEFAULT_EXPIRY_ALERT_DAYS);

  const batches = await batchRepository.listBatches({
    filter: { isActive: true },
    limit: 1000,
  });

  const notifications = [];

  for (const batch of batches) {
    const drug = await drugRepository.findDrugById(batch.drugId);

    if (!drug || !drug.isActive) {
      continue;
    }

    if (batch.expiryDate < now) {
      notifications.push(
        ...(await notifyForBatchAtLocations({
          batch,
          drug,
          type: NOTIFICATION_TYPES.EXPIRED,
          title: "Expired batch alert",
          messagePrefix: "Expired:",
          dedupePrefix: "expired",
        })),
      );
      continue;
    }

    if (batch.expiryDate <= nearExpiryBefore) {
      notifications.push(
        ...(await notifyForBatchAtLocations({
          batch,
          drug,
          type: NOTIFICATION_TYPES.NEAR_EXPIRY,
          title: "Near expiry alert",
          messagePrefix: "Near expiry:",
          dedupePrefix: "near-expiry",
        })),
      );
    }
  }

  return { created: notifications.length };
};

export const runLowStockAlerts = async () => {
  const rows = await inventoryRepository.listInventory({
    filter: { quantity: { $gt: 0 } },
    limit: 2000,
  });

  const seen = new Set();
  const notifications = [];

  for (const row of rows) {
    const key = `${row.locationType}:${row.locationId}:${row.drugId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    notifications.push(
      ...(await checkLowStockAtLocation(
        row.locationType,
        String(row.locationId),
        String(row.drugId),
      )),
    );
  }

  return { created: notifications.length };
};

export const runAllAlerts = async () => {
  const [lowStock, expiry] = await Promise.all([
    runLowStockAlerts(),
    runExpiryAlerts(),
  ]);

  return {
    lowStockCreated: lowStock.created,
    expiryCreated: expiry.created,
    totalCreated: lowStock.created + expiry.created,
  };
};
