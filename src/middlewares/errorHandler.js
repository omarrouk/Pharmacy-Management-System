import { logger } from "../utils/logger.js";

const sendResponse = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });

export const notFoundHandler = (req, res) => {
  return sendResponse(res, 404, "The requested resource was not found.", {
    code: "NOT_FOUND",
  });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;
  const code = error.code ?? "INTERNAL_SERVER_ERROR";
  const message =
    statusCode >= 500 ? "An unexpected error occurred." : error.message;

  if (statusCode >= 500) {
    logger.error("Unhandled request error", {
      error: error.message,
      path: req.path,
    });
  }

  return sendResponse(res, statusCode, message, {
    code,
    ...(error.details ? { details: error.details } : {}),
  });
};
