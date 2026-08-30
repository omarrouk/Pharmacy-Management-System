import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as batchService from "../services/batch.service.js";

export const createBatch = asyncHandler(async (req, res) => {
  const batch = await batchService.createBatch(req.body);
  return success(res, "Batch created.", batch, 201);
});

export const listBatches = asyncHandler(async (req, res) => {
  const result = await batchService.listBatches(req.validatedQuery);
  return success(res, "Batches retrieved.", result);
});

export const getBatch = asyncHandler(async (req, res) => {
  const batch = await batchService.getBatchById(req.params.id);
  return success(res, "Batch retrieved.", batch);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await batchService.updateBatch(req.params.id, req.body);
  return success(res, "Batch updated.", batch);
});

export const deactivateBatch = asyncHandler(async (req, res) => {
  const batch = await batchService.deactivateBatch(req.params.id);
  return success(res, "Batch deactivated.", batch);
});

export const listFefo = asyncHandler(async (req, res) => {
  const batches = await batchService.listBatchesByDrugFefo(req.params.drugId);
  return success(res, "Batches retrieved by earliest expiry.", batches);
});
