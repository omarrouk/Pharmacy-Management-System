import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as supplierReturnService from "../services/supplierReturn.service.js";

export const createSupplierReturn = asyncHandler(async (req, res) => {
  const supplierReturn = await supplierReturnService.createSupplierReturn(
    req.user,
    req.body,
  );
  return success(res, "Supplier return recorded.", supplierReturn, 201);
});

export const listSupplierReturns = asyncHandler(async (req, res) => {
  const result = await supplierReturnService.listSupplierReturns(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Supplier returns retrieved.", result);
});

export const getSupplierReturn = asyncHandler(async (req, res) => {
  const supplierReturn = await supplierReturnService.getSupplierReturnById(
    req.user,
    req.params.id,
  );
  return success(res, "Supplier return retrieved.", supplierReturn);
});
