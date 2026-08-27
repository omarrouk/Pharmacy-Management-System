export const success = (res, message, data = null, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
