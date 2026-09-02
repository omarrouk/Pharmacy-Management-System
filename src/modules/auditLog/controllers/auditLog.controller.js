import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as auditLogService from "../services/auditLog.service.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.listAuditLogs(req.user, req.validatedQuery);
  return success(res, "Audit logs retrieved.", result);
});

export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await auditLogService.getAuditLogById(req.user, req.params.id);
  return success(res, "Audit log retrieved.", log);
});
