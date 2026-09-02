import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import * as auditLogRepository from "../repositories/auditLog.repository.js";

const toPublic = (doc) => doc.toJSON();

const managerRoles = new Set([
  ROLES.SYSTEM_ADMIN,
  ROLES.PHARMACY_ADMIN,
  ROLES.PHARMACY_MANAGER,
  ROLES.WAREHOUSE_MANAGER,
]);

export const assertCanReadAuditLogs = (actor) => {
  if (!managerRoles.has(actor.role)) {
    throw new AppError("You cannot access audit logs.", 403, "FORBIDDEN");
  }
};

export const listAuditLogs = async (
  actor,
  { page, limit, action, userId, entityType, entityId },
) => {
  assertCanReadAuditLogs(actor);

  const filter = {};

  if (action) filter.action = action;
  if (userId) filter.userId = userId;
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    auditLogRepository.listAuditLogs({ filter, skip, limit }),
    auditLogRepository.countAuditLogs(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getAuditLogById = async (actor, id) => {
  assertCanReadAuditLogs(actor);

  const log = await auditLogRepository.findAuditLogById(id);

  if (!log) {
    throw new AppError("Audit log was not found.", 404, "AUDIT_LOG_NOT_FOUND");
  }

  return toPublic(log);
};
