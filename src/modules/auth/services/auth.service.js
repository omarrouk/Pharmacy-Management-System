import { getPermissionsForRole } from "../../../constants/permissions.js";
import { AppError } from "../../../utils/appError.js";
import {
  decodeToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt.js";
import { comparePassword } from "../../../utils/password.js";
import * as refreshTokenRepository from "../repositories/refreshToken.repository.js";
import * as userRepository from "../../user/repositories/user.repository.js";
import { recordAuditLog } from "../../auditLog/services/auditLogRecorder.service.js";
import { AUDIT_ACTIONS } from "../../../constants/audit.js";

const buildAccessPayload = (user) => ({
  sub: String(user._id),
  role: user.role,
});

export const issueTokenPair = async (user) => {
  const accessToken = signAccessToken(buildAccessPayload(user));
  const refreshToken = signRefreshToken({ sub: String(user._id) });
  const decoded = decodeToken(refreshToken);

  await refreshTokenRepository.createRefreshToken({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
  });

  return { accessToken, refreshToken };
};

const toAuthUser = (user) => ({
  id: String(user._id),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  pharmacyIds: user.pharmacyIds,
  warehouseIds: user.warehouseIds,
  permissions: getPermissionsForRole(user.role),
});

export const login = async ({ email, password }) => {
  const user = await userRepository.findUserByEmail(email, {
    includePassword: true,
  });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new AppError("Account is not active.", 401, "INACTIVE_ACCOUNT");
  }

  const tokens = await issueTokenPair(user);

  await recordAuditLog(user, {
    action: AUDIT_ACTIONS.AUTH_LOGIN,
    entityType: "User",
    entityId: String(user._id),
  });

  return {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 401, "UNAUTHENTICATED");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401, "INVALID_TOKEN");
  }

  const stored = await refreshTokenRepository.findActiveRefreshToken(
    hashToken(refreshToken),
  );

  if (!stored) {
    throw new AppError("Invalid or expired refresh token.", 401, "INVALID_TOKEN");
  }

  const user = await userRepository.findUserById(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError("Account is not active.", 401, "INACTIVE_ACCOUNT");
  }

  await refreshTokenRepository.deleteRefreshToken(hashToken(refreshToken));

  const tokens = await issueTokenPair(user);

  return {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await refreshTokenRepository.deleteRefreshToken(hashToken(refreshToken));
};

export const getCurrentUser = (user) => toAuthUser(user);
