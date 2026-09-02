import * as auditLogRepository from "../repositories/auditLog.repository.js";

export const recordAuditLog = async (
  actor,
  { action, entityType = "", entityId = "", metadata = {} },
  session,
) => {
  if (!actor?._id) {
    return null;
  }

  return auditLogRepository.createAuditLog(
    {
      userId: actor._id,
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      metadata,
    },
    session,
  );
};
