import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getDatabaseHealth } from "./config/database.js";
import { apiRateLimiter } from "./middlewares/apiRateLimiter.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import activeIngredientRoutes from "./modules/activeIngredient/routes/activeIngredient.routes.js";
import authRoutes from "./modules/auth/routes/auth.routes.js";
import categoryRoutes from "./modules/category/routes/category.routes.js";
import drugRoutes from "./modules/drug/routes/drug.routes.js";
import batchRoutes from "./modules/batch/routes/batch.routes.js";
import inventoryRoutes from "./modules/inventory/routes/inventory.routes.js";
import stockMovementRoutes from "./modules/stockMovement/routes/stockMovement.routes.js";
import supplyRequestRoutes from "./modules/supplyRequest/routes/supplyRequest.routes.js";
import shipmentRoutes from "./modules/shipment/routes/shipment.routes.js";
import supplierRoutes from "./modules/supplier/routes/supplier.routes.js";
import purchaseRequestRoutes from "./modules/purchaseRequest/routes/purchaseRequest.routes.js";
import purchaseOrderRoutes from "./modules/purchaseOrder/routes/purchaseOrder.routes.js";
import purchaseReceiptRoutes from "./modules/purchaseReceipt/routes/purchaseReceipt.routes.js";
import purchaseInvoiceRoutes from "./modules/purchaseInvoice/routes/purchaseInvoice.routes.js";
import paymentMethodRoutes from "./modules/paymentMethod/routes/paymentMethod.routes.js";
import salesInvoiceRoutes from "./modules/salesInvoice/routes/salesInvoice.routes.js";
import inventoryAdjustmentRoutes from "./modules/inventoryAdjustment/routes/inventoryAdjustment.routes.js";
import destructionRoutes from "./modules/destruction/routes/destruction.routes.js";
import customerReturnRoutes from "./modules/customerReturn/routes/customerReturn.routes.js";
import supplierReturnRoutes from "./modules/supplierReturn/routes/supplierReturn.routes.js";
import pharmacyReturnRoutes from "./modules/pharmacyReturn/routes/pharmacyReturn.routes.js";
import auditLogRoutes from "./modules/auditLog/routes/auditLog.routes.js";
import notificationRoutes from "./modules/notification/routes/notification.routes.js";
import reportRoutes from "./modules/report/routes/report.routes.js";
import manufacturerRoutes from "./modules/manufacturer/routes/manufacturer.routes.js";
import pharmacyRoutes from "./modules/pharmacy/routes/pharmacy.routes.js";
import userRoutes from "./modules/user/routes/user.routes.js";
import warehouseRoutes from "./modules/warehouse/routes/warehouse.routes.js";

const startedAt = Date.now();

export const createApp = () => {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
  const trustProxy = process.env.TRUST_PROXY === "true";

  if (trustProxy) {
    app.set("trust proxy", 1);
  }

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
  app.use(requestLogger);
  app.use("/api/v1", apiRateLimiter);

  app.get("/api/v1/health", (req, res) => {
    const database = getDatabaseHealth();

    res.status(200).json({
      success: true,
      message: "System works well.",
      data: {
        service: "pharmacy-management-system",
        environment: process.env.NODE_ENV ?? "development",
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        database,
      },
    });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/warehouses", warehouseRoutes);
  app.use("/api/v1/pharmacies", pharmacyRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/manufacturers", manufacturerRoutes);
  app.use("/api/v1/active-ingredients", activeIngredientRoutes);
  app.use("/api/v1/drugs", drugRoutes);
  app.use("/api/v1/batches", batchRoutes);
  app.use("/api/v1/inventory", inventoryRoutes);
  app.use("/api/v1/stock-movements", stockMovementRoutes);
  app.use("/api/v1/supply-requests", supplyRequestRoutes);
  app.use("/api/v1/shipments", shipmentRoutes);
  app.use("/api/v1/suppliers", supplierRoutes);
  app.use("/api/v1/purchase-requests", purchaseRequestRoutes);
  app.use("/api/v1/purchase-orders", purchaseOrderRoutes);
  app.use("/api/v1/purchase-receipts", purchaseReceiptRoutes);
  app.use("/api/v1/purchase-invoices", purchaseInvoiceRoutes);
  app.use("/api/v1/payment-methods", paymentMethodRoutes);
  app.use("/api/v1/sales-invoices", salesInvoiceRoutes);
  app.use("/api/v1/inventory-adjustments", inventoryAdjustmentRoutes);
  app.use("/api/v1/destructions", destructionRoutes);
  app.use("/api/v1/customer-returns", customerReturnRoutes);
  app.use("/api/v1/supplier-returns", supplierReturnRoutes);
  app.use("/api/v1/pharmacy-returns", pharmacyReturnRoutes);
  app.use("/api/v1/audit-logs", auditLogRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/reports", reportRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
