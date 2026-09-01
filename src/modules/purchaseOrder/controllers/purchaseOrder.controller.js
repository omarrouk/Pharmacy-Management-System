import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as purchaseOrderService from "../services/purchaseOrder.service.js";

export const listPurchaseOrders = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.listPurchaseOrders(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Purchase orders retrieved.", result);
});

export const getPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.getPurchaseOrderById(
    req.user,
    req.params.id,
  );
  return success(res, "Purchase order retrieved.", order);
});
