import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as customerReturnService from "../services/customerReturn.service.js";

export const createCustomerReturn = asyncHandler(async (req, res) => {
  const customerReturn = await customerReturnService.createCustomerReturn(
    req.user,
    req.body,
  );
  return success(res, "Customer return recorded.", customerReturn, 201);
});

export const listCustomerReturns = asyncHandler(async (req, res) => {
  const result = await customerReturnService.listCustomerReturns(
    req.user,
    req.validatedQuery,
  );
  return success(res, "Customer returns retrieved.", result);
});

export const getCustomerReturn = asyncHandler(async (req, res) => {
  const customerReturn = await customerReturnService.getCustomerReturnById(
    req.user,
    req.params.id,
  );
  return success(res, "Customer return retrieved.", customerReturn);
});
