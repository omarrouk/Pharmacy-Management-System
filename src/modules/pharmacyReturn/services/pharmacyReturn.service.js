import mongoose from "mongoose";
import { PHARMACY_RETURN_STATUSES } from "../../../constants/pharmacyReturn.js";
import { ROLES } from "../../../constants/roles.js";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_TYPES,
} from "../../../constants/stockMovement.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessPharmacy, canAccessWarehouse } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as pharmacyRepository from "../../pharmacy/repositories/pharmacy.repository.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import * as stockMovementRepository from "../../stockMovement/repositories/stockMovement.repository.js";
import * as pharmacyReturnRepository from "../repositories/pharmacyReturn.repository.js";

const toPublic = (doc) => doc.toJSON();

const canAccessPharmacyReturn = (actor, pharmacyReturn) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return true;
  }

  return (
    canAccessPharmacy(actor, String(pharmacyReturn.pharmacyId)) ||
    canAccessWarehouse(actor, String(pharmacyReturn.warehouseId))
  );
};

export const buildPharmacyReturnScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  const or = [];

  if (actor.pharmacyIds?.length) {
    or.push({ pharmacyId: { $in: actor.pharmacyIds } });
  }

  if (actor.warehouseIds?.length) {
    or.push({ warehouseId: { $in: actor.warehouseIds } });
  }

  if (!or.length) {
    return { _id: null };
  }

  return { $or: or };
};

const getPharmacyReturnOrThrow = async (id) => {
  const pharmacyReturn = await pharmacyReturnRepository.findPharmacyReturnById(id);

  if (!pharmacyReturn) {
    throw new AppError("Pharmacy return was not found.", 404, "PHARMACY_RETURN_NOT_FOUND");
  }

  return pharmacyReturn;
};

const generateReturnNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `PRET-${date}-`;
  const count = await pharmacyReturnRepository.countPharmacyReturnsWithPrefix(prefix);

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

const assertBatchForDrug = async (drugId, batchId) => {
  const batch = await batchRepository.findBatchById(batchId);

  if (!batch || !batch.isActive) {
    throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
  }

  if (String(batch.drugId) !== String(drugId)) {
    throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
  }
};

const assertReceivedFromPrimaryWarehouse = async (
  pharmacyId,
  warehouseId,
  drugId,
  batchId,
) => {
  const received = await stockMovementRepository.hasSupplyReceivingFromWarehouse(
    pharmacyId,
    warehouseId,
    drugId,
    batchId,
  );

  if (!received) {
    throw new AppError(
      "Batch was not received from the primary warehouse.",
      400,
      "BATCH_NOT_FROM_WAREHOUSE",
    );
  }
};

export const createPharmacyReturn = async (actor, payload) => {
  if (!canAccessPharmacy(actor, payload.pharmacyId)) {
    throw new AppError("You cannot create returns for this pharmacy.", 403, "FORBIDDEN");
  }

  const pharmacy = await pharmacyRepository.findPharmacyById(payload.pharmacyId);

  if (!pharmacy || !pharmacy.isActive) {
    throw new AppError("Pharmacy was not found or is inactive.", 400, "INVALID_PHARMACY");
  }

  const warehouseId = String(pharmacy.primaryWarehouseId);

  for (const item of payload.items) {
    const drug = await drugRepository.findDrugById(item.drugId);

    if (!drug || !drug.isActive) {
      throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
    }

    await assertBatchForDrug(item.drugId, item.batchId);
    await assertReceivedFromPrimaryWarehouse(
      payload.pharmacyId,
      warehouseId,
      item.drugId,
      item.batchId,
    );
  }

  const returnNumber = await generateReturnNumber();
  const pharmacyReturn = await pharmacyReturnRepository.createPharmacyReturn({
    returnNumber,
    pharmacyId: payload.pharmacyId,
    warehouseId,
    status: PHARMACY_RETURN_STATUSES.PREPARED,
    reason: payload.reason,
    items: payload.items.map((item) => ({
      drugId: item.drugId,
      batchId: item.batchId,
      sentQuantity: item.sentQuantity,
      receivedQuantity: 0,
      shortageQuantity: 0,
    })),
    createdBy: actor._id,
  });

  return toPublic(pharmacyReturn);
};

export const listPharmacyReturns = async (
  actor,
  { page, limit, status, pharmacyId, warehouseId },
) => {
  const filter = { ...buildPharmacyReturnScopeFilter(actor) };

  if (status) filter.status = status;
  if (pharmacyId) filter.pharmacyId = pharmacyId;
  if (warehouseId) filter.warehouseId = warehouseId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    pharmacyReturnRepository.listPharmacyReturns({ filter, skip, limit }),
    pharmacyReturnRepository.countPharmacyReturns(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getPharmacyReturnById = async (actor, id) => {
  const pharmacyReturn = await getPharmacyReturnOrThrow(id);

  if (!canAccessPharmacyReturn(actor, pharmacyReturn)) {
    throw new AppError("You cannot access this pharmacy return.", 403, "FORBIDDEN");
  }

  return toPublic(pharmacyReturn);
};

export const sendPharmacyReturn = async (actor, id) => {
  const pharmacyReturn = await getPharmacyReturnOrThrow(id);

  if (!canAccessPharmacy(actor, String(pharmacyReturn.pharmacyId))) {
    throw new AppError("You cannot send this pharmacy return.", 403, "FORBIDDEN");
  }

  if (pharmacyReturn.status !== PHARMACY_RETURN_STATUSES.PREPARED) {
    throw new AppError("Only prepared returns can be sent.", 400, "INVALID_STATUS");
  }

  const reference = `pharmacyReturn:${String(pharmacyReturn._id)}`;
  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      for (const item of pharmacyReturn.items) {
        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.RETURN_TO_WAREHOUSE,
            direction: MOVEMENT_DIRECTIONS.OUT,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.sentQuantity,
            locationType: LOCATION_TYPES.PHARMACY,
            locationId: String(pharmacyReturn.pharmacyId),
            counterpartyLocationType: LOCATION_TYPES.WAREHOUSE,
            counterpartyLocationId: String(pharmacyReturn.warehouseId),
            reference,
            reason: pharmacyReturn.reason,
          },
          actor,
          session,
        );
      }

      updated = await pharmacyReturnRepository.updatePharmacyReturnById(
        id,
        {
          status: PHARMACY_RETURN_STATUSES.SENT,
          sentBy: actor._id,
          sentAt: new Date(),
        },
        session,
      );
    });

    return toPublic(updated);
  } finally {
    await session.endSession();
  }
};

export const receivePharmacyReturn = async (actor, id, payload) => {
  const pharmacyReturn = await getPharmacyReturnOrThrow(id);

  if (!canAccessWarehouse(actor, String(pharmacyReturn.warehouseId))) {
    throw new AppError("You cannot receive this pharmacy return.", 403, "FORBIDDEN");
  }

  if (
    pharmacyReturn.status !== PHARMACY_RETURN_STATUSES.SENT &&
    pharmacyReturn.status !== PHARMACY_RETURN_STATUSES.PARTIALLY_RECEIVED
  ) {
    throw new AppError(
      "Only sent or partially received returns can be received.",
      400,
      "INVALID_STATUS",
    );
  }

  const itemMap = new Map(
    pharmacyReturn.items.map((item) => [
      `${String(item.drugId)}:${String(item.batchId)}`,
      item,
    ]),
  );

  const receiveMap = new Map(
    payload.items.map((item) => [
      `${String(item.drugId)}:${String(item.batchId)}`,
      item.receivedQuantity,
    ]),
  );

  if (receiveMap.size !== itemMap.size) {
    throw new AppError("Received items must match all return items.", 400, "ITEM_MISMATCH");
  }

  const updatedItems = pharmacyReturn.items.map((item) => {
    const key = `${String(item.drugId)}:${String(item.batchId)}`;
    const receivedQuantity = receiveMap.get(key);

    if (receivedQuantity === undefined) {
      throw new AppError("Missing received quantity for a return item.", 400, "ITEM_MISMATCH");
    }

    if (receivedQuantity > item.sentQuantity) {
      throw new AppError(
        "Received quantity cannot exceed sent quantity.",
        400,
        "INVALID_RECEIVED_QUANTITY",
      );
    }

    return {
      drugId: item.drugId,
      batchId: item.batchId,
      sentQuantity: item.sentQuantity,
      receivedQuantity,
      shortageQuantity: item.sentQuantity - receivedQuantity,
    };
  });

  const reference = `pharmacyReturn:${String(pharmacyReturn._id)}`;
  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      for (const item of updatedItems) {
        if (item.receivedQuantity <= 0) {
          continue;
        }

        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.RETURN_FROM_PHARMACY,
            direction: MOVEMENT_DIRECTIONS.IN,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.receivedQuantity,
            locationType: LOCATION_TYPES.WAREHOUSE,
            locationId: String(pharmacyReturn.warehouseId),
            counterpartyLocationType: LOCATION_TYPES.PHARMACY,
            counterpartyLocationId: String(pharmacyReturn.pharmacyId),
            reference,
            reason: pharmacyReturn.reason,
          },
          actor,
          session,
        );
      }

      const fullyReceived = updatedItems.every(
        (item) => item.receivedQuantity === item.sentQuantity,
      );

      updated = await pharmacyReturnRepository.updatePharmacyReturnById(
        id,
        {
          status: fullyReceived
            ? PHARMACY_RETURN_STATUSES.RECEIVED
            : PHARMACY_RETURN_STATUSES.PARTIALLY_RECEIVED,
          items: updatedItems,
          receivedBy: actor._id,
          receivedAt: new Date(),
        },
        session,
      );
    });

    return toPublic(updated);
  } finally {
    await session.endSession();
  }
};
