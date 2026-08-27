import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as warehouseService from "../services/warehouse.service.js";

export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.createWarehouse(req.body);
  return success(res, "Warehouse created.", warehouse, 201);
});

export const listWarehouses = asyncHandler(async (req, res) => {
  const result = await warehouseService.listWarehouses(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Warehouses retrieved.", result);
});

export const getWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.getWarehouseById(
    req.user,
    req.params.id,
  );
  return success(res, "Warehouse retrieved.", warehouse);
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.updateWarehouse(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Warehouse updated.", warehouse);
});

export const deactivateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.deactivateWarehouse(req.params.id);
  return success(res, "Warehouse deactivated.", warehouse);
});
