import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as reportService from "../services/report.service.js";

export const salesReport = asyncHandler(async (req, res) => {
  const result = await reportService.getSalesReport(req.user, req.validatedQuery);
  return success(res, "Sales report retrieved.", result);
});

export const bestSellingReport = asyncHandler(async (req, res) => {
  const result = await reportService.getBestSellingDrugsReport(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Best-selling drugs report retrieved.", result);
});

export const purchasesReport = asyncHandler(async (req, res) => {
  const result = await reportService.getPurchasesReport(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Purchases report retrieved.", result);
});

export const stockMovementsReport = asyncHandler(async (req, res) => {
  const result = await reportService.getStockMovementsReport(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Stock movements report retrieved.", result);
});

export const inventoryReport = asyncHandler(async (req, res) => {
  const result = await reportService.getInventoryReport(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Inventory report retrieved.", result);
});

export const nearExpiryReport = asyncHandler(async (req, res) => {
  const result = await reportService.getNearExpiryReport(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Near-expiry report retrieved.", result);
});

export const expiredReport = asyncHandler(async (req, res) => {
  const result = await reportService.getExpiredReport(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Expired drugs report retrieved.", result);
});
