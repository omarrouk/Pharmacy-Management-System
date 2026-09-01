import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as purchaseInvoiceService from "../services/purchaseInvoice.service.js";

export const listPurchaseInvoices = asyncHandler(async (req, res) => {
  const result = await purchaseInvoiceService.listPurchaseInvoices(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Purchase invoices retrieved.", result);
});

export const getPurchaseInvoice = asyncHandler(async (req, res) => {
  const invoice = await purchaseInvoiceService.getPurchaseInvoiceById(
    req.user,
    req.params.id,
  );
  return success(res, "Purchase invoice retrieved.", invoice);
});
