import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as activeIngredientService from "../services/activeIngredient.service.js";

export const createActiveIngredient = asyncHandler(async (req, res) => {
  const ingredient = await activeIngredientService.createActiveIngredient(
    req.body,
  );
  return success(res, "Active ingredient created.", ingredient, 201);
});

export const listActiveIngredients = asyncHandler(async (req, res) => {
  const result = await activeIngredientService.listActiveIngredients(
    req.validatedQuery,
  );
  return success(res, "Active ingredients retrieved.", result);
});

export const getActiveIngredient = asyncHandler(async (req, res) => {
  const ingredient = await activeIngredientService.getActiveIngredientById(
    req.params.id,
  );
  return success(res, "Active ingredient retrieved.", ingredient);
});

export const updateActiveIngredient = asyncHandler(async (req, res) => {
  const ingredient = await activeIngredientService.updateActiveIngredient(
    req.params.id,
    req.body,
  );
  return success(res, "Active ingredient updated.", ingredient);
});

export const deactivateActiveIngredient = asyncHandler(async (req, res) => {
  const ingredient = await activeIngredientService.deactivateActiveIngredient(
    req.params.id,
  );
  return success(res, "Active ingredient deactivated.", ingredient);
});
