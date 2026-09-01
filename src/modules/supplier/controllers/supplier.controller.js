import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as supplierService from "../services/supplier.service.js";

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  return success(res, "Supplier created.", supplier, 201);
});

export const listSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.listSuppliers(req.validatedQuery);
  return success(res, "Suppliers retrieved.", result);
});

export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  return success(res, "Supplier retrieved.", supplier);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  return success(res, "Supplier updated.", supplier);
});

export const deactivateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.deactivateSupplier(req.params.id);
  return success(res, "Supplier deactivated.", supplier);
});
