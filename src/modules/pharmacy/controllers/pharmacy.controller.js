import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as pharmacyService from "../services/pharmacy.service.js";

export const createPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await pharmacyService.createPharmacy(req.body);
  return success(res, "Pharmacy created.", pharmacy, 201);
});

export const listPharmacies = asyncHandler(async (req, res) => {
  const result = await pharmacyService.listPharmacies(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Pharmacies retrieved.", result);
});

export const getPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await pharmacyService.getPharmacyById(
    req.user,
    req.params.id,
  );
  return success(res, "Pharmacy retrieved.", pharmacy);
});

export const updatePharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await pharmacyService.updatePharmacy(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Pharmacy updated.", pharmacy);
});

export const deactivatePharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await pharmacyService.deactivatePharmacy(req.params.id);
  return success(res, "Pharmacy deactivated.", pharmacy);
});
