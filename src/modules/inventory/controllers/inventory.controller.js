import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as inventoryService from "../services/inventory.service.js";

export const listInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.listInventory(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Inventory retrieved.", result);
});

export const getInventorySummary = asyncHandler(async (req, res) => {
  const summary = await inventoryService.getDrugSummaryAtLocation(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Inventory summary retrieved.", summary);
});

export const getInventory = asyncHandler(async (req, res) => {
  const record = await inventoryService.getInventoryById(req.user, req.params.id);
  return success(res, "Inventory record retrieved.", record);
});
