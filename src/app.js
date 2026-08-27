import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getDatabaseHealth } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./modules/auth/routes/auth.routes.js";
import userRoutes from "./modules/user/routes/user.routes.js";
import warehouseRoutes from "./modules/warehouse/routes/warehouse.routes.js";

export const createApp = () => {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "System works well.",
      data: {
        service: "pharmacy-management-system",
        database: getDatabaseHealth(),
      },
    });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/warehouses", warehouseRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
