import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as destructionService from "../services/destruction.service.js";

export const createDestruction = asyncHandler(async (req, res) => {
  const destruction = await destructionService.createDestruction(req.user, req.body);
  return success(res, "Destruction recorded.", destruction, 201);
});

export const listDestructions = asyncHandler(async (req, res) => {
  const result = await destructionService.listDestructions(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Destruction records retrieved.", result);
});

export const getDestruction = asyncHandler(async (req, res) => {
  const destruction = await destructionService.getDestructionById(
    req.user,
    req.params.id,
  );
  return success(res, "Destruction record retrieved.", destruction);
});
