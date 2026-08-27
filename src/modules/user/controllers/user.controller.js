import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as userService from "../services/user.service.js";

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.user, req.body);
  return success(res, "User created.", user, 201);
});

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.user, req.validatedQuery);
  return success(res, "Users retrieved.", result);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user, req.params.id);
  return success(res, "User retrieved.", user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body);
  return success(res, "User updated.", user);
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.user, req.params.id);
  return success(res, "User deactivated.", user);
});
