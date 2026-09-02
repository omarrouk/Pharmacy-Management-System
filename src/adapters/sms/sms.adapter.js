import { logger } from "../../utils/logger.js";

export const sendSms = async ({ to, message }) => {
  logger.info("SMS notification (console provider)", { to, message });
  return { delivered: true, provider: "console" };
};
