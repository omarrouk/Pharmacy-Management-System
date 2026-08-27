import dotenv from "dotenv";

dotenv.config();

import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { logger } from "./utils/logger.js";

const mongoUri = process.env.MONGO_URI;
const port = Number(process.env.PORT ?? 3000);
const environment = process.env.NODE_ENV ?? "development";

let server;
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  logger.info("Shutdown requested", { signal });

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      logger.info("HTTP server closed");
    }

    await disconnectDatabase();

    logger.info("Database connection closed");

    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

process.once("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });

  shutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });

  shutdown("UNHANDLED_REJECTION");
});

const start = async () => {
  if (!mongoUri) {
    logger.error("MONGO_URI is not defined");
    process.exit(1);
  }

  try {
    await connectDatabase(mongoUri);

    const app = createApp();

    server = app.listen(port, () => {
      logger.info("HTTP server started", {
        port,
        environment,
      });
    });

    server.on("error", (error) => {
      logger.error("HTTP server error", {
        error: error.message,
        stack: error.stack,
      });

      shutdown("SERVER_ERROR");
    });
  } catch (error) {
    logger.error("Server failed to start", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};

start();
