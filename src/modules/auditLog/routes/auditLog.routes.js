import { Router } from "express";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authorize } from "../../../middlewares/authorize.js";
import { validate } from "../../../middlewares/validate.js";
import * as auditLogController from "../controllers/auditLog.controller.js";
import {
  auditLogIdParamSchema,
  listAuditLogsQuerySchema,
} from "../validations/auditLog.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.AUDIT_LOGS_READ),
  validate(listAuditLogsQuerySchema, "query"),
  auditLogController.listAuditLogs,
);

router.get(
  "/:id",
  authorize(PERMISSIONS.AUDIT_LOGS_READ),
  validate(auditLogIdParamSchema, "params"),
  auditLogController.getAuditLog,
);

export default router;
