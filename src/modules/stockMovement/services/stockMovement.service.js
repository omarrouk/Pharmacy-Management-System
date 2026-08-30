import mongoose from "mongoose";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
} from "../../../constants/stockMovement.js";
import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessLocation } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as pharmacyRepository from "../../pharmacy/repositories/pharmacy.repository.js";
import * as warehouseRepository from "../../warehouse/repositories/warehouse.repository.js";
import * as inventoryRepository from "../../inventory/repositories/inventory.repository.js";
import * as stockMovementRepository from "../repositories/stockMovement.repository.js";

const toPublic = (doc) => doc.toJSON();

const buildMovementScopeFilter = (actor, { locationType, locationId }) => {
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

const assertLocationExists = async (locationType, locationId) => {
  if (locationType === LOCATION_TYPES.PHARMACY) {
    const pharmacy = await pharmacyRepository.findPharmacyById(locationId);

    if (!pharmacy || !pharmacy.isActive) {
      throw new AppError(
        "Pharmacy was not found or is inactive.",
        400,
        "INVALID_PHARMACY",
      );
    }

    return;
  }

  const warehouse = await warehouseRepository.findWarehouseById(locationId);

  if (!warehouse || !warehouse.isActive) {
    throw new AppError(
      "Warehouse was not found or is inactive.",
      400,
      "INVALID_WAREHOUSE",
    );
  }
};

const assertBatchMatchesDrug = async (drugId, batchId) => {
  const [drug, batch] = await Promise.all([
    drugRepository.findDrugById(drugId),
    batchRepository.findBatchById(batchId),
  ]);

  if (!drug || !drug.isActive) {
    throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
  }

  if (!batch || !batch.isActive) {
    throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
  }

  if (String(batch.drugId) !== String(drugId)) {
    throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
  }
};

export const applyStockMovement = async (payload, actor, session) => {
  const {
    movementType,
    direction,
    drugId,
    batchId,
    quantity,
    locationType,
    locationId,
    counterpartyLocationType = null,
    counterpartyLocationId = null,
    reference = "",
    reason = "",
  } = payload;

  if (!canAccessLocation(actor, locationType, locationId)) {
    throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
  }

  await assertLocationExists(locationType, locationId);
  await assertBatchMatchesDrug(drugId, batchId);

  if (counterpartyLocationType && counterpartyLocationId) {
    await assertLocationExists(counterpartyLocationType, counterpartyLocationId);
  }

  let inventory;

  if (direction === MOVEMENT_DIRECTIONS.IN) {
    inventory = await inventoryRepository.increaseQuantity(
      { locationType, locationId, drugId, batchId, quantity },
      session,
    );
  } else if (direction === MOVEMENT_DIRECTIONS.OUT) {
    inventory = await inventoryRepository.decreaseQuantity(
      { locationType, locationId, batchId, quantity },
      session,
    );

    if (!inventory) {
      throw new AppError("Insufficient stock.", 400, "INSUFFICIENT_STOCK");
    }
  } else {
    throw new AppError("Invalid movement direction.", 400, "INVALID_DIRECTION");
  }

  const movementData = {
    movementType,
    direction,
    drugId,
    batchId,
    quantity,
    locationType,
    locationId,
    reference,
    reason,
    performedBy: actor._id,
  };

  if (counterpartyLocationType && counterpartyLocationId) {
    movementData.counterpartyLocationType = counterpartyLocationType;
    movementData.counterpartyLocationId = counterpartyLocationId;
  }

  const movement = await stockMovementRepository.createStockMovement(
    movementData,
    session,
  );

  return {
    movement: toPublic(movement),
    inventory: toPublic(inventory),
  };
};

export const recordStockMovement = async (actor, payload) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await applyStockMovement(payload, actor, session);
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const listStockMovements = async (
  actor,
  { page, limit, locationType, locationId, drugId, batchId, movementType },
) => {
  const scopeFilter = buildMovementScopeFilter(actor, { locationType, locationId });
  const filter = { ...scopeFilter };

  if (drugId) {
    filter.drugId = drugId;
  }

  if (batchId) {
    filter.batchId = batchId;
  }

  if (movementType) {
    filter.movementType = movementType;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    stockMovementRepository.listStockMovements({ filter, skip, limit }),
    stockMovementRepository.countStockMovements(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getStockMovementById = async (actor, id) => {
  const movement = await stockMovementRepository.findStockMovementById(id);

  if (!movement) {
    throw new AppError(
      "Stock movement was not found.",
      404,
      "STOCK_MOVEMENT_NOT_FOUND",
    );
  }

  if (
    !canAccessLocation(
      actor,
      movement.locationType,
      String(movement.locationId),
    )
  ) {
    throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
  }

  return toPublic(movement);
};
