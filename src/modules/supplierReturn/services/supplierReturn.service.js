import mongoose from "mongoose";
import { ROLES } from "../../../constants/roles.js";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_TYPES,
} from "../../../constants/stockMovement.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessWarehouse } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as purchaseReceiptRepository from "../../purchaseReceipt/repositories/purchaseReceipt.repository.js";
import { getSupplierById } from "../../supplier/services/supplier.service.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import * as supplierReturnRepository from "../repositories/supplierReturn.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildSupplierReturnScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.warehouseIds?.length) {
    return { _id: null };
  }

  return { warehouseId: { $in: actor.warehouseIds } };
};

const generateReturnNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `SRET-${date}-`;
  const count = await supplierReturnRepository.countSupplierReturnsWithPrefix(prefix);

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

export const createSupplierReturn = async (actor, payload) => {
  if (!canAccessWarehouse(actor, payload.warehouseId)) {
    throw new AppError("You cannot return from this warehouse.", 403, "FORBIDDEN");
  }

  await getSupplierById(payload.supplierId);

  for (const item of payload.items) {
    const drug = await drugRepository.findDrugById(item.drugId);

    if (!drug || !drug.isActive) {
      throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
    }

    const batch = await batchRepository.findBatchById(item.batchId);

    if (!batch || !batch.isActive) {
      throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
    }

    if (String(batch.drugId) !== String(item.drugId)) {
      throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
    }

    const receipt = await purchaseReceiptRepository.findPurchaseReceiptWithBatch(
      payload.warehouseId,
      payload.supplierId,
      item.drugId,
      item.batchId,
    );

    if (!receipt) {
      throw new AppError(
        "Batch was not purchased from this supplier at this warehouse.",
        400,
        "BATCH_NOT_FROM_SUPPLIER",
      );
    }
  }

  const session = await mongoose.startSession();

  try {
    let supplierReturn;

    await session.withTransaction(async () => {
      const returnNumber = await generateReturnNumber();
      const reference = `supplierReturn:${returnNumber}`;

      for (const item of payload.items) {
        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.RETURN_TO_SUPPLIER,
            direction: MOVEMENT_DIRECTIONS.OUT,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.quantity,
            locationType: LOCATION_TYPES.WAREHOUSE,
            locationId: String(payload.warehouseId),
            reference,
            reason: payload.reason,
          },
          actor,
          session,
        );
      }

      supplierReturn = await supplierReturnRepository.createSupplierReturn(
        {
          returnNumber,
          warehouseId: payload.warehouseId,
          supplierId: payload.supplierId,
          reason: payload.reason,
          items: payload.items,
          createdBy: actor._id,
        },
        session,
      );
    });

    return toPublic(supplierReturn);
  } finally {
    await session.endSession();
  }
};

export const listSupplierReturns = async (
  actor,
  { page, limit, warehouseId, supplierId },
) => {
  const filter = { ...buildSupplierReturnScopeFilter(actor) };

  if (warehouseId) {
    if (!canAccessWarehouse(actor, warehouseId)) {
      throw new AppError("You cannot access this warehouse.", 403, "FORBIDDEN");
    }

    filter.warehouseId = warehouseId;
  }

  if (supplierId) {
    filter.supplierId = supplierId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    supplierReturnRepository.listSupplierReturns({ filter, skip, limit }),
    supplierReturnRepository.countSupplierReturns(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getSupplierReturnById = async (actor, id) => {
  const supplierReturn = await supplierReturnRepository.findSupplierReturnById(id);

  if (!supplierReturn) {
    throw new AppError("Supplier return was not found.", 404, "SUPPLIER_RETURN_NOT_FOUND");
  }

  if (!canAccessWarehouse(actor, String(supplierReturn.warehouseId))) {
    throw new AppError("You cannot access this supplier return.", 403, "FORBIDDEN");
  }

  return toPublic(supplierReturn);
};
