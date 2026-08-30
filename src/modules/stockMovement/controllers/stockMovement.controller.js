import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as stockMovementService from "../services/stockMovement.service.js";

export const createStockMovement = asyncHandler(async (req, res) => {
  const result = await stockMovementService.recordStockMovement(req.user, req.body);
  return success(res, "Stock movement recorded.", result, 201);
});

export const listStockMovements = asyncHandler(async (req, res) => {
  const result = await stockMovementService.listStockMovements(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Stock movements retrieved.", result);
});

export const getStockMovement = asyncHandler(async (req, res) => {
  const movement = await stockMovementService.getStockMovementById(
    req.user,
    req.params.id,
  );
  return success(res, "Stock movement retrieved.", movement);
});
