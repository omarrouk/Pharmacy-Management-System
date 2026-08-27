import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  return secret;
};

export const signAccessToken = (payload) =>
  jwt.sign(payload, getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, getAccessSecret());

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getRefreshSecret());

export const decodeToken = (token) => jwt.decode(token);

export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");
