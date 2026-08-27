import { RefreshToken } from "../models/refreshToken.model.js";

export const createRefreshToken = (data) => RefreshToken.create(data);

export const findActiveRefreshToken = (tokenHash) =>
  RefreshToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

export const deleteRefreshToken = (tokenHash) =>
  RefreshToken.deleteOne({ tokenHash });

export const deleteAllUserRefreshTokens = (userId) =>
  RefreshToken.deleteMany({ userId });
