import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as salesInvoiceService from "../services/salesInvoice.service.js";

export const createSalesInvoice = asyncHandler(async (req, res) => {
  const invoice = await salesInvoiceService.createSalesInvoice(req.user, req.body);
  return success(res, "Sales invoice created.", invoice, 201);
});

export const listSalesInvoices = asyncHandler(async (req, res) => {
  const result = await salesInvoiceService.listSalesInvoices(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Sales invoices retrieved.", result);
});

export const getSalesInvoice = asyncHandler(async (req, res) => {
  const invoice = await salesInvoiceService.getSalesInvoiceById(
    req.user,
    req.params.id,
  );
  return success(res, "Sales invoice retrieved.", invoice);
});
