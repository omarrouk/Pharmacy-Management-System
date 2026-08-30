import { AppError } from "../../../utils/appError.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as batchRepository from "../repositories/batch.repository.js";

const toPublic = (doc) => doc.toJSON();

const assertDrugExists = async (drugId) => {
  const drug = await drugRepository.findDrugById(drugId);

  if (!drug || !drug.isActive) {
    throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
  }
};

const buildListFilter = ({ drugId, search }) => {
  const filter = {};

  if (drugId) {
    filter.drugId = drugId;
  }

  if (search) {
    filter.batchNumber = { $regex: search, $options: "i" };
  }

  return filter;
};

export const createBatch = async (payload) => {
  await assertDrugExists(payload.drugId);

  const batchNumber = payload.batchNumber.toUpperCase();
  const existing = await batchRepository.findBatchByDrugAndNumber(
    payload.drugId,
    batchNumber,
  );

  if (existing) {
    throw new AppError(
      "Batch number already exists for this drug.",
      409,
      "BATCH_NUMBER_IN_USE",
    );
  }

  const batch = await batchRepository.createBatch({
    drugId: payload.drugId,
    batchNumber,
    expiryDate: payload.expiryDate,
    source: payload.source ?? "",
    receiptReference: payload.receiptReference ?? "",
  });

  return toPublic(batch);
};

export const listBatches = async ({ page, limit, drugId, search }) => {
  const filter = buildListFilter({ drugId, search });
  const skip = (page - 1) * limit;
  const sort = drugId ? { expiryDate: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    batchRepository.listBatches({ filter, skip, limit, sort }),
    batchRepository.countBatches(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getBatchById = async (id) => {
  const batch = await batchRepository.findBatchById(id);

  if (!batch) {
    throw new AppError("Batch was not found.", 404, "BATCH_NOT_FOUND");
  }

  return toPublic(batch);
};

export const updateBatch = async (id, payload) => {
  const current = await batchRepository.findBatchById(id);

  if (!current) {
    throw new AppError("Batch was not found.", 404, "BATCH_NOT_FOUND");
  }

  const updated = await batchRepository.updateBatchById(id, payload);
  return toPublic(updated);
};

export const deactivateBatch = async (id) => {
  const batch = await batchRepository.findBatchById(id);

  if (!batch) {
    throw new AppError("Batch was not found.", 404, "BATCH_NOT_FOUND");
  }

  if (!batch.isActive) {
    return toPublic(batch);
  }

  const updated = await batchRepository.updateBatchById(id, { isActive: false });
  return toPublic(updated);
};

export const listBatchesByDrugFefo = async (drugId) => {
  await assertDrugExists(drugId);

  const batches = await batchRepository.listBatchesByDrugFefo(drugId);
  return batches.map(toPublic);
};
