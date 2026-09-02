import { AuditLog } from "../models/auditLog.model.js";

export const createAuditLog = (data, session) => {
  if (session) {
    return AuditLog.create([data], { session }).then(([doc]) => doc);
  }

  return AuditLog.create(data);
};

export const findAuditLogById = (id) => AuditLog.findById(id);

export const listAuditLogs = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countAuditLogs = (filter = {}) => AuditLog.countDocuments(filter);
