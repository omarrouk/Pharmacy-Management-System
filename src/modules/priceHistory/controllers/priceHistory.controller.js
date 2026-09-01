import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as priceHistoryService from "../services/priceHistory.service.js";

export const updateSellingPrice = asyncHandler(async (req, res) => {
  const drug = await priceHistoryService.updateSellingPrice(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Selling price updated.", drug);
});

export const listPriceHistory = asyncHandler(async (req, res) => {
  const result = await priceHistoryService.listPriceHistory(
    req.params.id,
    req.validatedQuery,
  );
  return success(res, "Price history retrieved.", result);
});
