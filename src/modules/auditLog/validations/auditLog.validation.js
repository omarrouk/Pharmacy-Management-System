import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const listAuditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  action: Joi.string().trim().max(100),
  userId: objectId,
  entityType: Joi.string().trim().max(80),
  entityId: Joi.string().trim().max(80),
});

export const exportAuditLogsQuerySchema = Joi.object({
  action: Joi.string().trim().max(100),
  userId: objectId,
  entityType: Joi.string().trim().max(80),
  entityId: Joi.string().trim().max(80),
});

export const auditLogIdParamSchema = Joi.object({
  id: objectId.required(),
});
