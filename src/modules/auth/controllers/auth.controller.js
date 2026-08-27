import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  clearAuthCookies,
  getRefreshCookie,
  setAuthCookies,
} from "../../../utils/cookies.js";
import { success } from "../../../utils/response.js";
import * as authService from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  setAuthCookies(res, result);

  return success(res, "Login successful.", { user: result.user });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(getRefreshCookie(req));

  setAuthCookies(res, result);

  return success(res, "Token refreshed.", { user: result.user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(getRefreshCookie(req));
  clearAuthCookies(res);
  return success(res, "Logout successful.");
});

export const me = asyncHandler(async (req, res) => {
  return success(res, "Current user.", authService.getCurrentUser(req.user));
});
