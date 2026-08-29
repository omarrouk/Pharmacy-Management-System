import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as drugService from "../services/drug.service.js";

export const createDrug = asyncHandler(async (req, res) => {
  const drug = await drugService.createDrug(req.body);
  return success(res, "Drug created.", drug, 201);
});

export const listDrugs = asyncHandler(async (req, res) => {
  const result = await drugService.listDrugs(req.validatedQuery);
  return success(res, "Drugs retrieved.", result);
});

export const getDrug = asyncHandler(async (req, res) => {
  const drug = await drugService.getDrugById(req.params.id);
  return success(res, "Drug retrieved.", drug);
});

export const updateDrug = asyncHandler(async (req, res) => {
  const drug = await drugService.updateDrug(req.params.id, req.body);
  return success(res, "Drug updated.", drug);
});

export const deactivateDrug = asyncHandler(async (req, res) => {
  const drug = await drugService.deactivateDrug(req.params.id);
  return success(res, "Drug deactivated.", drug);
});

export const listAlternatives = asyncHandler(async (req, res) => {
  const drugs = await drugService.listDrugsByActiveIngredient(
    req.params.activeIngredientId,
  );
  return success(res, "Alternative drugs retrieved.", drugs);
});
