import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as purchaseRequestService from "../services/purchaseRequest.service.js";

export const createPurchaseRequest = asyncHandler(async (req, res) => {
  const result = await purchaseRequestService.createPurchaseRequest(
    req.user,
    req.body,
  );

  const message = result.purchaseOrder
    ? "Purchase request created and approved."
    : "Purchase request created.";

  return success(res, message, result, 201);
});

export const listPurchaseRequests = asyncHandler(async (req, res) => {
  const result = await purchaseRequestService.listPurchaseRequests(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Purchase requests retrieved.", result);
});

export const getPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.getPurchaseRequestById(
    req.user,
    req.params.id,
  );
  return success(res, "Purchase request retrieved.", request);
});

export const approvePurchaseRequest = asyncHandler(async (req, res) => {
  const result = await purchaseRequestService.approvePurchaseRequest(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Purchase request approved.", result);
});

export const rejectPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.rejectPurchaseRequest(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Purchase request rejected.", request);
});

export const cancelPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.cancelPurchaseRequest(
    req.user,
    req.params.id,
  );
  return success(res, "Purchase request cancelled.", request);
});
