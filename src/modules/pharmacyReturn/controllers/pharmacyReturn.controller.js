import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as pharmacyReturnService from "../services/pharmacyReturn.service.js";

export const createPharmacyReturn = asyncHandler(async (req, res) => {
  const pharmacyReturn = await pharmacyReturnService.createPharmacyReturn(
    req.user,
    req.body,
  );
  return success(res, "Pharmacy return created.", pharmacyReturn, 201);
});

export const listPharmacyReturns = asyncHandler(async (req, res) => {
  const result = await pharmacyReturnService.listPharmacyReturns(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Pharmacy returns retrieved.", result);
});

export const getPharmacyReturn = asyncHandler(async (req, res) => {
  const pharmacyReturn = await pharmacyReturnService.getPharmacyReturnById(
    req.user,
    req.params.id,
  );
  return success(res, "Pharmacy return retrieved.", pharmacyReturn);
});

export const sendPharmacyReturn = asyncHandler(async (req, res) => {
  const pharmacyReturn = await pharmacyReturnService.sendPharmacyReturn(
    req.user,
    req.params.id,
  );
  return success(res, "Pharmacy return sent.", pharmacyReturn);
});

export const receivePharmacyReturn = asyncHandler(async (req, res) => {
  const pharmacyReturn = await pharmacyReturnService.receivePharmacyReturn(
    req.user,
    req.params.id,
    req.body,
  );
  return success(res, "Pharmacy return received.", pharmacyReturn);
});
