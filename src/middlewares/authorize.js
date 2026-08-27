import { hasPermission } from "../constants/permissions.js";
import { AppError } from "../utils/appError.js";

export const authorize =
  (...requiredPermissions) =>
  (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError("Authentication is required.", 401, "UNAUTHENTICATED"),
      );
    }

    const allowed = requiredPermissions.every((permission) =>
      hasPermission(req.user.role, permission),
    );

    if (!allowed) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          403,
          "FORBIDDEN",
        ),
      );
    }

    return next();
  };
