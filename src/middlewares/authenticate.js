import { AppError } from "../utils/appError.js";
import { getAccessCookie } from "../utils/cookies.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { findUserById } from "../modules/user/repositories/user.repository.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = getAccessCookie(req);

    if (!token) {
      throw new AppError(
        "Authentication is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          "Access token expired.",
          401,
          "ACCESS_TOKEN_EXPIRED",
        );
      }

      throw new AppError("Invalid access token.", 401, "INVALID_TOKEN");
    }

    const user = await findUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new AppError("Account is not active.", 401, "INACTIVE_ACCOUNT");
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
