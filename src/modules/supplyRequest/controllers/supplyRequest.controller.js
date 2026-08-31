import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as supplyRequestService from "../services/supplyRequest.service.js";

export const createPharmacySupplyRequest = asyncHandler(async (req, res) => {
  const request = await supplyRequestService.createPharmacySupplyRequest(
    req.user,
    req.body,
  );
  return success(res, "Supply request created.", request, 201);
});

export const createWarehouseSupplyRequest = asyncHandler(async (req, res) => {
  const request = await supplyRequestService.createWarehouseSupplyRequest(
    req.user,
    req.body,
  );
  return success(res, "Supply request created.", request, 201);
});

export const listSupplyRequests = asyncHandler(async (req, res) => {
  const result = await supplyRequestService.listSupplyRequests(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Supply requests retrieved.", result);
});

export const getSupplyRequest = asyncHandler(async (req, res) => {
  const request = await supplyRequestService.getSupplyRequestById(
    req.user,
    req.params.id,
  );
  return success(res, "Supply request retrieved.", request);
});

export const approveSupplyRequest = asyncHandler(async (req, res) => {
  const request = await supplyRequestService.approveSupplyRequest(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Supply request approved.", request);
});

export const rejectSupplyRequest = asyncHandler(async (req, res) => {
  const request = await supplyRequestService.rejectSupplyRequest(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Supply request rejected.", request);
});

export const cancelSupplyRequest = asyncHandler(async (req, res) => {
  const request = await supplyRequestService.cancelSupplyRequest(
    req.user,
    req.params.id,
  );
  return success(res, "Supply request cancelled.", request);
});
