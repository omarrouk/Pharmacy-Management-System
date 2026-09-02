import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as inventoryAdjustmentService from "../services/inventoryAdjustment.service.js";

export const createInventoryAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await inventoryAdjustmentService.createInventoryAdjustment(
    req.user,
    req.body,
  );
  return success(res, "Inventory adjustment recorded.", adjustment, 201);
});

export const listInventoryAdjustments = asyncHandler(async (req, res) => {
  const result = await inventoryAdjustmentService.listInventoryAdjustments(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Inventory adjustments retrieved.", result);
});

export const getInventoryAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await inventoryAdjustmentService.getInventoryAdjustmentById(
    req.user,
    req.params.id,
  );
  return success(res, "Inventory adjustment retrieved.", adjustment);
});
