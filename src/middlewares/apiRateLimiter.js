import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const max = Number(process.env.API_RATE_LIMIT_MAX ?? 300);

export const apiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    data: { code: "RATE_LIMITED" },
  },
});
