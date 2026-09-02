import mongoose from "mongoose";
import { ROLES } from "../../../constants/roles.js";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_TYPES,
} from "../../../constants/stockMovement.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessLocation } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import * as inventoryAdjustmentRepository from "../repositories/inventoryAdjustment.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildInventoryAdjustmentScopeFilter = (actor) => {
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

const generateAdjustmentNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ADJ-${date}-`;
  const count =
    await inventoryAdjustmentRepository.countInventoryAdjustmentsWithPrefix(prefix);

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

const assertItemReferences = async (item) => {
  const [drug, batch] = await Promise.all([
    drugRepository.findDrugById(item.drugId),
    batchRepository.findBatchById(item.batchId),
  ]);

  if (!drug || !drug.isActive) {
    throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
  }

  if (!batch || !batch.isActive) {
    throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
  }

  if (String(batch.drugId) !== String(item.drugId)) {
    throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
  }
};

export const createInventoryAdjustment = async (actor, payload) => {
  if (!canAccessLocation(actor, payload.locationType, payload.locationId)) {
    throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
  }

  for (const item of payload.items) {
    await assertItemReferences(item);
  }

  const session = await mongoose.startSession();

  try {
    let adjustment;

    await session.withTransaction(async () => {
      const adjustmentNumber = await generateAdjustmentNumber();
      const reference = `adjustment:${adjustmentNumber}`;

      for (const item of payload.items) {
        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.INVENTORY_ADJUSTMENT,
            direction: item.direction,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.quantity,
            locationType: payload.locationType,
            locationId: String(payload.locationId),
            reference,
            reason: payload.reason,
          },
          actor,
          session,
        );
      }

      adjustment = await inventoryAdjustmentRepository.createInventoryAdjustment(
        {
          adjustmentNumber,
          locationType: payload.locationType,
          locationId: payload.locationId,
          reason: payload.reason,
          items: payload.items,
          createdBy: actor._id,
        },
        session,
      );
    });

    return toPublic(adjustment);
  } finally {
    await session.endSession();
  }
};

export const listInventoryAdjustments = async (
  actor,
  { page, limit, locationType, locationId },
) => {
  const filter = { ...buildInventoryAdjustmentScopeFilter(actor) };

  if (locationType && locationId) {
    if (!canAccessLocation(actor, locationType, locationId)) {
      throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
    }

    filter.locationType = locationType;
    filter.locationId = locationId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    inventoryAdjustmentRepository.listInventoryAdjustments({ filter, skip, limit }),
    inventoryAdjustmentRepository.countInventoryAdjustments(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getInventoryAdjustmentById = async (actor, id) => {
  const adjustment = await inventoryAdjustmentRepository.findInventoryAdjustmentById(id);

  if (!adjustment) {
    throw new AppError(
      "Inventory adjustment was not found.",
      404,
      "INVENTORY_ADJUSTMENT_NOT_FOUND",
    );
  }

  if (
    !canAccessLocation(
      actor,
      adjustment.locationType,
      String(adjustment.locationId),
    )
  ) {
    throw new AppError("You cannot access this inventory adjustment.", 403, "FORBIDDEN");
  }

  return toPublic(adjustment);
};
