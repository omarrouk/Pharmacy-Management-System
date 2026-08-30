import { ROLES } from "../../../constants/roles.js";
import { LOCATION_TYPES } from "../../../constants/stockMovement.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessLocation } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as pharmacyRepository from "../../pharmacy/repositories/pharmacy.repository.js";
import * as warehouseRepository from "../../warehouse/repositories/warehouse.repository.js";
import * as inventoryRepository from "../repositories/inventory.repository.js";

const toMap = (items, key = "_id") =>
  new Map(items.map((item) => [String(item[key]), item]));

const enrichInventoryRecords = async (records) => {
  if (!records.length) {
    return [];
  }

  const drugIds = [...new Set(records.map((record) => String(record.drugId)))];
  const batchIds = [...new Set(records.map((record) => String(record.batchId)))];
  const warehouseIds = [
    ...new Set(
      records
        .filter((record) => record.locationType === LOCATION_TYPES.WAREHOUSE)
        .map((record) => String(record.locationId)),
    ),
  ];
  const pharmacyIds = [
    ...new Set(
      records
        .filter((record) => record.locationType === LOCATION_TYPES.PHARMACY)
        .map((record) => String(record.locationId)),
    ),
  ];

  const [drugs, batches, warehouses, pharmacies] = await Promise.all([
    drugRepository.findDrugsByIds(drugIds),
    batchRepository.findBatchesByIds(batchIds),
    warehouseRepository.findWarehousesByIds(warehouseIds),
    pharmacyRepository.findPharmaciesByIds(pharmacyIds),
  ]);

  const drugMap = toMap(drugs);
  const batchMap = toMap(batches);
  const warehouseMap = toMap(warehouses);
  const pharmacyMap = toMap(pharmacies);

  return records.map((record) => {
    const base = record.toJSON();
    const drug = drugMap.get(String(record.drugId));
    const batch = batchMap.get(String(record.batchId));
    const location =
      record.locationType === LOCATION_TYPES.WAREHOUSE
        ? warehouseMap.get(String(record.locationId))
        : pharmacyMap.get(String(record.locationId));

    return {
      ...base,
      locationName: location?.name ?? null,
      locationCode: location?.code ?? null,
      drugName: drug?.name ?? null,
      batchNumber: batch?.batchNumber ?? null,
      expiryDate: batch?.expiryDate ?? null,
    };
  });
};

const enrichLocation = async (locationType, locationId) => {
  if (locationType === LOCATION_TYPES.WAREHOUSE) {
    const warehouse = await warehouseRepository.findWarehouseById(locationId);
    return {
      locationName: warehouse?.name ?? null,
      locationCode: warehouse?.code ?? null,
    };
  }

  const pharmacy = await pharmacyRepository.findPharmacyById(locationId);
  return {
    locationName: pharmacy?.name ?? null,
    locationCode: pharmacy?.code ?? null,
  };
};

export const buildInventoryScopeFilter = (actor, { locationType, locationId }) => {
  if (locationType && locationId) {
    if (!canAccessLocation(actor, locationType, locationId)) {
      throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
    }

    return { locationType, locationId };
  }

  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  const or = [];

  if (actor.pharmacyIds?.length) {
    or.push({
      locationType: LOCATION_TYPES.PHARMACY,
      locationId: { $in: actor.pharmacyIds },
    });
  }

  if (actor.warehouseIds?.length) {
    or.push({
      locationType: LOCATION_TYPES.WAREHOUSE,
      locationId: { $in: actor.warehouseIds },
    });
  }

  if (!or.length) {
    return { _id: null };
  }

  return { $or: or };
};

export const listInventory = async (
  actor,
  { page, limit, locationType, locationId, drugId, batchId },
) => {
  const scopeFilter = buildInventoryScopeFilter(actor, { locationType, locationId });
  const filter = { ...scopeFilter };

  if (drugId) {
    filter.drugId = drugId;
  }

  if (batchId) {
    filter.batchId = batchId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    inventoryRepository.listInventory({ filter, skip, limit }),
    inventoryRepository.countInventory(filter),
  ]);

  return {
    items: await enrichInventoryRecords(items),
    page,
    limit,
    total,
  };
};

export const getInventoryById = async (actor, id) => {
  const record = await inventoryRepository.findInventoryById(id);

  if (!record) {
    throw new AppError("Inventory record was not found.", 404, "INVENTORY_NOT_FOUND");
  }

  if (!canAccessLocation(actor, record.locationType, String(record.locationId))) {
    throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
  }

  const [enriched] = await enrichInventoryRecords([record]);
  return enriched;
};

export const getDrugSummaryAtLocation = async (
  actor,
  { locationType, locationId, drugId },
) => {
  if (!canAccessLocation(actor, locationType, locationId)) {
    throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
  }

  const [result, drug, location] = await Promise.all([
    inventoryRepository.sumDrugQuantityAtLocation(locationType, locationId, drugId),
    drugRepository.findDrugById(drugId),
    enrichLocation(locationType, locationId),
  ]);

  return {
    locationType,
    locationId,
    locationName: location.locationName,
    locationCode: location.locationCode,
    drugId,
    drugName: drug?.name ?? null,
    totalQuantity: result[0]?.totalQuantity ?? 0,
  };
};
