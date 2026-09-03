import mongoose from "mongoose";
import { ROLES } from "../../../constants/roles.js";
import { DEFAULT_EXPIRY_ALERT_DAYS } from "../../../constants/notifications.js";
import { LOCATION_TYPES } from "../../../constants/stockMovement.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessPharmacy, canAccessWarehouse } from "../../../utils/scope.js";
import { SalesInvoice } from "../../salesInvoice/models/salesInvoice.model.js";
import { PurchaseReceipt } from "../../purchaseReceipt/models/purchaseReceipt.model.js";
import { StockMovement } from "../../stockMovement/models/stockMovement.model.js";
import { Inventory } from "../../inventory/models/inventory.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const parseDateRange = ({ from, to }) => {
  const filter = {};

  if (from) {
    filter.$gte = new Date(from);
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }

  return Object.keys(filter).length ? filter : null;
};

const assertPharmacyFilter = (actor, pharmacyId) => {
  if (!pharmacyId) return;
  if (!canAccessPharmacy(actor, pharmacyId)) {
    throw new AppError("You cannot access this pharmacy.", 403, "FORBIDDEN");
  }
};

const assertWarehouseFilter = (actor, warehouseId) => {
  if (!warehouseId) return;
  if (!canAccessWarehouse(actor, warehouseId)) {
    throw new AppError("You cannot access this warehouse.", 403, "FORBIDDEN");
  }
};

const pharmacyScopeIds = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) return null;
  return (actor.pharmacyIds ?? []).map((id) => toObjectId(id));
};

const warehouseScopeIds = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) return null;
  return (actor.warehouseIds ?? []).map((id) => toObjectId(id));
};

const canAccessLocationSafe = (actor, locationType, locationId) => {
  if (locationType === LOCATION_TYPES.PHARMACY) {
    return canAccessPharmacy(actor, locationId);
  }

  if (locationType === LOCATION_TYPES.WAREHOUSE) {
    return canAccessWarehouse(actor, locationId);
  }

  return false;
};

const locationScopeMatch = (actor, { locationType, locationId } = {}) => {
  if (locationType && locationId) {
    if (!canAccessLocationSafe(actor, locationType, locationId)) {
      throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
    }

    return {
      locationType,
      locationId: toObjectId(locationId),
    };
  }

  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  const or = [];
  const pharmacyIds = pharmacyScopeIds(actor);
  const warehouseIds = warehouseScopeIds(actor);

  if (pharmacyIds?.length) {
    or.push({
      locationType: LOCATION_TYPES.PHARMACY,
      locationId: { $in: pharmacyIds },
    });
  }

  if (warehouseIds?.length) {
    or.push({
      locationType: LOCATION_TYPES.WAREHOUSE,
      locationId: { $in: warehouseIds },
    });
  }

  if (!or.length) {
    return { _id: null };
  }

  return { $or: or };
};

const stringifyValue = (value) => {
  if (value instanceof mongoose.Types.ObjectId) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(stringifyValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, stringifyValue(nested)]),
    );
  }

  return value;
};

const stringifyIds = (rows) => rows.map((row) => stringifyValue(row));

const daysBetween = (from, to) =>
  Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));

export const getSalesReport = async (actor, query) => {
  assertPharmacyFilter(actor, query.pharmacyId);

  const match = {};
  const dateRange = parseDateRange(query);

  if (dateRange) match.createdAt = dateRange;

  if (query.pharmacyId) {
    match.pharmacyId = toObjectId(query.pharmacyId);
  } else {
    const scoped = pharmacyScopeIds(actor);
    if (scoped) {
      match.pharmacyId = scoped.length ? { $in: scoped } : { $in: [] };
    }
  }

  if (query.userId) {
    match.createdBy = toObjectId(query.userId);
  }

  const pipeline = [{ $match: match }, { $unwind: "$items" }];

  if (query.drugId) {
    pipeline.push({ $match: { "items.drugId": toObjectId(query.drugId) } });
  }

  if (query.categoryId) {
    pipeline.push(
      {
        $lookup: {
          from: "drugs",
          localField: "items.drugId",
          foreignField: "_id",
          as: "drug",
        },
      },
      { $unwind: "$drug" },
      { $match: { "drug.categoryId": toObjectId(query.categoryId) } },
    );
  }

  pipeline.push(
    {
      $group: {
        _id: {
          pharmacyId: "$pharmacyId",
          drugId: "$items.drugId",
        },
        invoiceCount: { $addToSet: "$_id" },
        quantitySold: { $sum: "$items.quantity" },
        grossAmount: { $sum: "$items.lineTotal" },
        discountAmount: { $sum: "$items.discountAmount" },
      },
    },
    {
      $lookup: {
        from: "drugs",
        localField: "_id.drugId",
        foreignField: "_id",
        as: "drug",
      },
    },
    { $unwind: { path: "$drug", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        pharmacyId: "$_id.pharmacyId",
        drugId: "$_id.drugId",
        drugName: "$drug.name",
        invoiceCount: { $size: "$invoiceCount" },
        quantitySold: 1,
        grossAmount: 1,
        discountAmount: 1,
      },
    },
    { $sort: { quantitySold: -1 } },
  );

  const items = await SalesInvoice.aggregate(pipeline);
  const totals = items.reduce(
    (acc, row) => {
      acc.quantitySold += row.quantitySold;
      acc.grossAmount += row.grossAmount;
      acc.discountAmount += row.discountAmount;
      return acc;
    },
    { quantitySold: 0, grossAmount: 0, discountAmount: 0 },
  );

  return {
    items: stringifyIds(items),
    totals: {
      quantitySold: totals.quantitySold,
      grossAmount: Math.round(totals.grossAmount * 100) / 100,
      discountAmount: Math.round(totals.discountAmount * 100) / 100,
      netAmount:
        Math.round((totals.grossAmount - totals.discountAmount) * 100) / 100,
    },
  };
};

export const getBestSellingDrugsReport = async (actor, query) => {
  assertPharmacyFilter(actor, query.pharmacyId);

  const match = {};
  const dateRange = parseDateRange(query);

  if (dateRange) match.createdAt = dateRange;

  if (query.pharmacyId) {
    match.pharmacyId = toObjectId(query.pharmacyId);
  } else {
    const scoped = pharmacyScopeIds(actor);
    if (scoped) {
      match.pharmacyId = scoped.length ? { $in: scoped } : { $in: [] };
    }
  }

  const limit = query.limit ?? 20;

  const items = await SalesInvoice.aggregate([
    { $match: match },
    { $unwind: "$items" },
    ...(query.drugId
      ? [{ $match: { "items.drugId": toObjectId(query.drugId) } }]
      : []),
    {
      $group: {
        _id: "$items.drugId",
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "drugs",
        localField: "_id",
        foreignField: "_id",
        as: "drug",
      },
    },
    { $unwind: { path: "$drug", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        drugId: "$_id",
        drugName: "$drug.name",
        barcode: "$drug.barcode",
        quantitySold: 1,
        revenue: 1,
      },
    },
  ]);

  return { items: stringifyIds(items), limit };
};

export const getPurchasesReport = async (actor, query) => {
  assertWarehouseFilter(actor, query.warehouseId);

  const match = {};
  const dateRange = parseDateRange(query);

  if (dateRange) match.createdAt = dateRange;

  if (query.warehouseId) {
    match.warehouseId = toObjectId(query.warehouseId);
  } else {
    const scoped = warehouseScopeIds(actor);
    if (scoped) {
      match.warehouseId = scoped.length ? { $in: scoped } : { $in: [] };
    }
  }

  if (query.supplierId) {
    match.supplierId = toObjectId(query.supplierId);
  }

  if (query.userId) {
    match.receivedBy = toObjectId(query.userId);
  }

  const pipeline = [{ $match: match }, { $unwind: "$items" }];

  if (query.drugId) {
    pipeline.push({ $match: { "items.drugId": toObjectId(query.drugId) } });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          warehouseId: "$warehouseId",
          supplierId: "$supplierId",
          drugId: "$items.drugId",
        },
        receiptCount: { $addToSet: "$_id" },
        quantityReceived: { $sum: "$items.quantity" },
        totalCost: { $sum: "$items.lineTotal" },
      },
    },
    {
      $lookup: {
        from: "drugs",
        localField: "_id.drugId",
        foreignField: "_id",
        as: "drug",
      },
    },
    { $unwind: { path: "$drug", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "suppliers",
        localField: "_id.supplierId",
        foreignField: "_id",
        as: "supplier",
      },
    },
    { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        warehouseId: "$_id.warehouseId",
        supplierId: "$_id.supplierId",
        supplierName: "$supplier.name",
        drugId: "$_id.drugId",
        drugName: "$drug.name",
        receiptCount: { $size: "$receiptCount" },
        quantityReceived: 1,
        totalCost: 1,
      },
    },
    { $sort: { totalCost: -1 } },
  );

  const items = await PurchaseReceipt.aggregate(pipeline);
  const totals = items.reduce(
    (acc, row) => {
      acc.quantityReceived += row.quantityReceived;
      acc.totalCost += row.totalCost;
      return acc;
    },
    { quantityReceived: 0, totalCost: 0 },
  );

  return {
    items: stringifyIds(items),
    totals: {
      quantityReceived: totals.quantityReceived,
      totalCost: Math.round(totals.totalCost * 100) / 100,
    },
  };
};

export const getStockMovementsReport = async (actor, query) => {
  const match = {
    ...locationScopeMatch(actor, {
      locationType: query.locationType,
      locationId: query.locationId,
    }),
  };

  const dateRange = parseDateRange(query);
  if (dateRange) match.createdAt = dateRange;
  if (query.drugId) match.drugId = toObjectId(query.drugId);
  if (query.userId) match.performedBy = toObjectId(query.userId);
  if (query.movementType) match.movementType = query.movementType;

  const items = await StockMovement.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          movementType: "$movementType",
          direction: "$direction",
          drugId: "$drugId",
          locationType: "$locationType",
          locationId: "$locationId",
        },
        movementCount: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
      },
    },
    {
      $lookup: {
        from: "drugs",
        localField: "_id.drugId",
        foreignField: "_id",
        as: "drug",
      },
    },
    { $unwind: { path: "$drug", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        movementType: "$_id.movementType",
        direction: "$_id.direction",
        drugId: "$_id.drugId",
        drugName: "$drug.name",
        locationType: "$_id.locationType",
        locationId: "$_id.locationId",
        movementCount: 1,
        totalQuantity: 1,
      },
    },
    { $sort: { totalQuantity: -1 } },
  ]);

  return { items: stringifyIds(items) };
};

export const getInventoryReport = async (actor, query) => {
  const match = {
    ...locationScopeMatch(actor, {
      locationType: query.locationType,
      locationId: query.locationId,
    }),
    quantity: { $gt: 0 },
  };

  if (query.drugId) {
    match.drugId = toObjectId(query.drugId);
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "drugs",
        localField: "drugId",
        foreignField: "_id",
        as: "drug",
      },
    },
    { $unwind: { path: "$drug", preserveNullAndEmptyArrays: true } },
  ];

  if (query.categoryId) {
    pipeline.push({
      $match: { "drug.categoryId": toObjectId(query.categoryId) },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "batches",
        localField: "batchId",
        foreignField: "_id",
        as: "batch",
      },
    },
    { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        locationType: 1,
        locationId: 1,
        drugId: 1,
        drugName: "$drug.name",
        categoryId: "$drug.categoryId",
        batchId: 1,
        batchNumber: "$batch.batchNumber",
        expiryDate: "$batch.expiryDate",
        quantity: 1,
        minimumStockThreshold: "$drug.minimumStockThreshold",
        isLowStock: {
          $and: [
            { $gt: [{ $ifNull: ["$drug.minimumStockThreshold", 0] }, 0] },
            {
              $lte: [
                "$quantity",
                { $ifNull: ["$drug.minimumStockThreshold", 0] },
              ],
            },
          ],
        },
      },
    },
    { $sort: { locationType: 1, drugName: 1, expiryDate: 1 } },
  );

  const items = await Inventory.aggregate(pipeline);
  const totals = {
    lines: items.length,
    totalQuantity: items.reduce((sum, row) => sum + row.quantity, 0),
    lowStockLines: items.filter((row) => row.isLowStock).length,
  };

  return { items: stringifyIds(items), totals };
};

const getExpiryInventoryRows = async (actor, query, { expiredOnly, nearOnly }) => {
  const now = new Date();
  const nearBefore = new Date(now);
  nearBefore.setDate(nearBefore.getDate() + (query.days ?? DEFAULT_EXPIRY_ALERT_DAYS));

  const match = {
    ...locationScopeMatch(actor, {
      locationType: query.locationType,
      locationId: query.locationId,
    }),
    quantity: { $gt: 0 },
  };

  if (query.drugId) {
    match.drugId = toObjectId(query.drugId);
  }

  const expiryMatch = expiredOnly
    ? { "batch.expiryDate": { $lt: now } }
    : nearOnly
      ? { "batch.expiryDate": { $gte: now, $lte: nearBefore } }
      : {};

  const rows = await Inventory.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "batches",
        localField: "batchId",
        foreignField: "_id",
        as: "batch",
      },
    },
    { $unwind: "$batch" },
    { $match: { "batch.isActive": true, ...expiryMatch } },
    {
      $lookup: {
        from: "drugs",
        localField: "drugId",
        foreignField: "_id",
        as: "drug",
      },
    },
    { $unwind: { path: "$drug", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        locationType: 1,
        locationId: 1,
        drugId: 1,
        drugName: "$drug.name",
        batchId: 1,
        batchNumber: "$batch.batchNumber",
        expiryDate: "$batch.expiryDate",
        quantity: 1,
      },
    },
    { $sort: { expiryDate: 1 } },
  ]);

  const items = rows.map((row) => ({
    ...row,
    daysToExpiry: daysBetween(now, row.expiryDate),
  }));

  return {
    items: stringifyIds(items),
    asOf: now.toISOString(),
    ...(nearOnly ? { withinDays: query.days ?? DEFAULT_EXPIRY_ALERT_DAYS } : {}),
  };
};

export const getNearExpiryReport = async (actor, query) =>
  getExpiryInventoryRows(actor, query, { nearOnly: true, expiredOnly: false });

export const getExpiredReport = async (actor, query) =>
  getExpiryInventoryRows(actor, query, { nearOnly: false, expiredOnly: true });
