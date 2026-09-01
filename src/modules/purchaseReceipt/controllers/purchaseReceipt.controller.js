import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as purchaseReceiptService from "../services/purchaseReceipt.service.js";

export const receivePurchase = asyncHandler(async (req, res) => {
  const result = await purchaseReceiptService.receivePurchase(req.user, req.body);
  return success(res, "Purchase received.", result, 201);
});

export const listPurchaseReceipts = asyncHandler(async (req, res) => {
  const result = await purchaseReceiptService.listPurchaseReceipts(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Purchase receipts retrieved.", result);
});

export const getPurchaseReceipt = asyncHandler(async (req, res) => {
  const receipt = await purchaseReceiptService.getPurchaseReceiptById(
    req.user,
    req.params.id,
  );
  return success(res, "Purchase receipt retrieved.", receipt);
});
