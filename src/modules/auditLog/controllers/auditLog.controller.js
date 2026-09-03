import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as auditLogService from "../services/auditLog.service.js";
import ExcelJS from "exceljs";

const safeSpreadsheetValue = (value) => {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

export const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.listAuditLogs(req.user, req.validatedQuery);
  return success(res, "Audit logs retrieved.", result);
});

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const logs = await auditLogService.exportAuditLogs(req.user, req.validatedQuery);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Audit Logs");

  sheet.columns = [
    { header: "Log ID", key: "id", width: 28 },
    { header: "User ID", key: "userId", width: 28 },
    { header: "Action", key: "action", width: 30 },
    { header: "Entity Type", key: "entityType", width: 22 },
    { header: "Entity ID", key: "entityId", width: 28 },
    { header: "Metadata", key: "metadata", width: 55 },
    { header: "Created At", key: "createdAt", width: 24 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = "A1:G1";

  logs.forEach((log) => {
    sheet.addRow({
      id: safeSpreadsheetValue(log.id),
      userId: safeSpreadsheetValue(log.userId),
      action: safeSpreadsheetValue(log.action),
      entityType: safeSpreadsheetValue(log.entityType),
      entityId: safeSpreadsheetValue(log.entityId),
      metadata: safeSpreadsheetValue(JSON.stringify(log.metadata ?? {})),
      createdAt: log.createdAt ? new Date(log.createdAt) : "",
    });
  });

  sheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="audit-logs-${date}.xlsx"`,
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  await workbook.xlsx.write(res);
  res.end();
});

export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await auditLogService.getAuditLogById(req.user, req.params.id);
  return success(res, "Audit log retrieved.", log);
});
