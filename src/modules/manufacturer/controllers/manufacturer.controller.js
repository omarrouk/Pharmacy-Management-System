import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as manufacturerService from "../services/manufacturer.service.js";

export const createManufacturer = asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.createManufacturer(req.body);
  return success(res, "Manufacturer created.", manufacturer, 201);
});

export const listManufacturers = asyncHandler(async (req, res) => {
  const result = await manufacturerService.listManufacturers(req.validatedQuery);
  return success(res, "Manufacturers retrieved.", result);
});

export const getManufacturer = asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.getManufacturerById(
    req.params.id,
  );
  return success(res, "Manufacturer retrieved.", manufacturer);
});

export const updateManufacturer = asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.updateManufacturer(
    req.params.id,
    req.body,
  );
  return success(res, "Manufacturer updated.", manufacturer);
});

export const deactivateManufacturer = asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.deactivateManufacturer(
    req.params.id,
  );
  return success(res, "Manufacturer deactivated.", manufacturer);
});
