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
import * as destructionRepository from "../repositories/destruction.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildDestructionScopeFilter = (actor) => {
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

const generateDestructionNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `DEST-${date}-`;
  const count = await destructionRepository.countDestructionsWithPrefix(prefix);

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

export const createDestruction = async (actor, payload) => {
  if (!canAccessLocation(actor, payload.locationType, payload.locationId)) {
    throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
  }

  for (const item of payload.items) {
    await assertItemReferences(item);
  }

  const session = await mongoose.startSession();

  try {
    let destruction;

    await session.withTransaction(async () => {
      const destructionNumber = await generateDestructionNumber();
      const reference = `destruction:${destructionNumber}`;

      for (const item of payload.items) {
        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.DESTRUCTION,
            direction: MOVEMENT_DIRECTIONS.OUT,
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

      destruction = await destructionRepository.createDestruction(
        {
          destructionNumber,
          locationType: payload.locationType,
          locationId: payload.locationId,
          reason: payload.reason,
          items: payload.items,
          createdBy: actor._id,
        },
        session,
      );
    });

    return toPublic(destruction);
  } finally {
    await session.endSession();
  }
};

export const listDestructions = async (
  actor,
  { page, limit, locationType, locationId },
) => {
  const filter = { ...buildDestructionScopeFilter(actor) };

  if (locationType && locationId) {
    if (!canAccessLocation(actor, locationType, locationId)) {
      throw new AppError("You cannot access this location.", 403, "FORBIDDEN");
    }

    filter.locationType = locationType;
    filter.locationId = locationId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    destructionRepository.listDestructions({ filter, skip, limit }),
    destructionRepository.countDestructions(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getDestructionById = async (actor, id) => {
  const destruction = await destructionRepository.findDestructionById(id);

  if (!destruction) {
    throw new AppError("Destruction record was not found.", 404, "DESTRUCTION_NOT_FOUND");
  }

  if (
    !canAccessLocation(
      actor,
      destruction.locationType,
      String(destruction.locationId),
    )
  ) {
    throw new AppError("You cannot access this destruction record.", 403, "FORBIDDEN");
  }

  return toPublic(destruction);
};
