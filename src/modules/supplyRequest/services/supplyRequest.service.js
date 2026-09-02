import { ROLES } from "../../../constants/roles.js";
import { LOCATION_TYPES } from "../../../constants/stockMovement.js";
import {
  SUPPLY_REQUEST_STATUSES,
  SUPPLY_REQUEST_TYPES,
} from "../../../constants/supplyRequest.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessLocation } from "../../../utils/scope.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as pharmacyRepository from "../../pharmacy/repositories/pharmacy.repository.js";
import * as warehouseRepository from "../../warehouse/repositories/warehouse.repository.js";
import * as supplyRequestRepository from "../repositories/supplyRequest.repository.js";
import { recordAuditLog } from "../../auditLog/services/auditLogRecorder.service.js";
import { AUDIT_ACTIONS } from "../../../constants/audit.js";
import { notifySupplyRequestUpdate } from "../../notification/services/notification.service.js";

const toPublic = (doc) => doc.toJSON();

const assertDrugExists = async (drugId) => {
  const drug = await drugRepository.findDrugById(drugId);

  if (!drug || !drug.isActive) {
    throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
  }
};

const assertUniqueDrugItems = (items) => {
  const ids = items.map((item) => String(item.drugId));

  if (new Set(ids).size !== ids.length) {
    throw new AppError("Duplicate drugs are not allowed in one request.", 400, "DUPLICATE_DRUG");
  }
};

const canAccessSupplyRequest = (actor, request) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return true;
  }

  return (
    canAccessLocation(actor, request.requesterType, String(request.requesterId)) ||
    canAccessLocation(actor, request.sourceType, String(request.sourceId)) ||
    canAccessLocation(actor, request.destinationType, String(request.destinationId))
  );
};

export const buildSupplyRequestScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  const or = [];

  if (actor.pharmacyIds?.length) {
    const pharmacyScope = { $in: actor.pharmacyIds };

    or.push(
      { requesterType: LOCATION_TYPES.PHARMACY, requesterId: pharmacyScope },
      { sourceType: LOCATION_TYPES.PHARMACY, sourceId: pharmacyScope },
      {
        destinationType: LOCATION_TYPES.PHARMACY,
        destinationId: pharmacyScope,
      },
    );
  }

  if (actor.warehouseIds?.length) {
    const warehouseScope = { $in: actor.warehouseIds };

    or.push(
      { requesterType: LOCATION_TYPES.WAREHOUSE, requesterId: warehouseScope },
      { sourceType: LOCATION_TYPES.WAREHOUSE, sourceId: warehouseScope },
      {
        destinationType: LOCATION_TYPES.WAREHOUSE,
        destinationId: warehouseScope,
      },
    );
  }

  if (!or.length) {
    return { _id: null };
  }

  return { $or: or };
};

const getSupplyRequestOrThrow = async (id) => {
  const request = await supplyRequestRepository.findSupplyRequestById(id);

  if (!request) {
    throw new AppError(
      "Supply request was not found.",
      404,
      "SUPPLY_REQUEST_NOT_FOUND",
    );
  }

  return request;
};

export const createPharmacySupplyRequest = async (actor, payload) => {
  if (!canAccessLocation(actor, LOCATION_TYPES.PHARMACY, payload.pharmacyId)) {
    throw new AppError("You cannot access this pharmacy.", 403, "FORBIDDEN");
  }

  const pharmacy = await pharmacyRepository.findPharmacyById(payload.pharmacyId);

  if (!pharmacy || !pharmacy.isActive) {
    throw new AppError("Pharmacy was not found or is inactive.", 400, "INVALID_PHARMACY");
  }

  const warehouse = await warehouseRepository.findWarehouseById(
    pharmacy.primaryWarehouseId,
  );

  if (!warehouse || !warehouse.isActive) {
    throw new AppError(
      "Primary warehouse was not found or is inactive.",
      400,
      "INVALID_WAREHOUSE",
    );
  }

  assertUniqueDrugItems(payload.items);
  await Promise.all(payload.items.map((item) => assertDrugExists(item.drugId)));

  const request = await supplyRequestRepository.createSupplyRequest({
    requestType: SUPPLY_REQUEST_TYPES.PHARMACY_TO_WAREHOUSE,
    requesterType: LOCATION_TYPES.PHARMACY,
    requesterId: payload.pharmacyId,
    sourceType: LOCATION_TYPES.WAREHOUSE,
    sourceId: pharmacy.primaryWarehouseId,
    destinationType: LOCATION_TYPES.PHARMACY,
    destinationId: payload.pharmacyId,
    status: SUPPLY_REQUEST_STATUSES.PENDING_APPROVAL,
    items: payload.items.map((item) => ({
      drugId: item.drugId,
      requestedQuantity: item.requestedQuantity,
      approvedQuantity: null,
      itemReason: "",
    })),
    createdBy: actor._id,
  });

  return toPublic(request);
};

export const createWarehouseSupplyRequest = async (actor, payload) => {
  const { sourceWarehouseId, destinationWarehouseId } = payload;

  if (String(sourceWarehouseId) === String(destinationWarehouseId)) {
    throw new AppError(
      "Source and destination warehouses must be different.",
      400,
      "INVALID_WAREHOUSE_PAIR",
    );
  }

  if (
    !canAccessLocation(actor, LOCATION_TYPES.WAREHOUSE, destinationWarehouseId)
  ) {
    throw new AppError("You cannot access this warehouse.", 403, "FORBIDDEN");
  }

  const [source, destination] = await Promise.all([
    warehouseRepository.findWarehouseById(sourceWarehouseId),
    warehouseRepository.findWarehouseById(destinationWarehouseId),
  ]);

  if (!source || !source.isActive) {
    throw new AppError("Source warehouse was not found or is inactive.", 400, "INVALID_WAREHOUSE");
  }

  if (!destination || !destination.isActive) {
    throw new AppError(
      "Destination warehouse was not found or is inactive.",
      400,
      "INVALID_WAREHOUSE",
    );
  }

  assertUniqueDrugItems(payload.items);
  await Promise.all(payload.items.map((item) => assertDrugExists(item.drugId)));

  const request = await supplyRequestRepository.createSupplyRequest({
    requestType: SUPPLY_REQUEST_TYPES.WAREHOUSE_TO_WAREHOUSE,
    requesterType: LOCATION_TYPES.WAREHOUSE,
    requesterId: destinationWarehouseId,
    sourceType: LOCATION_TYPES.WAREHOUSE,
    sourceId: sourceWarehouseId,
    destinationType: LOCATION_TYPES.WAREHOUSE,
    destinationId: destinationWarehouseId,
    status: SUPPLY_REQUEST_STATUSES.PENDING_APPROVAL,
    items: payload.items.map((item) => ({
      drugId: item.drugId,
      requestedQuantity: item.requestedQuantity,
      approvedQuantity: null,
      itemReason: "",
    })),
    createdBy: actor._id,
  });

  return toPublic(request);
};

export const listSupplyRequests = async (actor, { page, limit, status, requestType }) => {
  const filter = { ...buildSupplyRequestScopeFilter(actor) };

  if (status) {
    filter.status = status;
  }

  if (requestType) {
    filter.requestType = requestType;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    supplyRequestRepository.listSupplyRequests({ filter, skip, limit }),
    supplyRequestRepository.countSupplyRequests(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getSupplyRequestById = async (actor, id) => {
  const request = await getSupplyRequestOrThrow(id);

  if (!canAccessSupplyRequest(actor, request)) {
    throw new AppError("You cannot access this supply request.", 403, "FORBIDDEN");
  }

  return toPublic(request);
};

export const approveSupplyRequest = async (actor, id, payload) => {
  const request = await getSupplyRequestOrThrow(id);

  if (!canAccessLocation(actor, request.sourceType, String(request.sourceId))) {
    throw new AppError(
      "You cannot approve requests for this source location.",
      403,
      "FORBIDDEN",
    );
  }

  if (request.status !== SUPPLY_REQUEST_STATUSES.PENDING_APPROVAL) {
    throw new AppError(
      "Only pending requests can be approved.",
      400,
      "INVALID_STATUS",
    );
  }

  const requestDrugIds = new Set(request.items.map((item) => String(item.drugId)));
  const approvalDrugIds = payload.items.map((item) => String(item.drugId));

  if (
    approvalDrugIds.length !== requestDrugIds.size ||
    approvalDrugIds.some((drugId) => !requestDrugIds.has(drugId))
  ) {
    throw new AppError(
      "Approval items must match all drugs on the request.",
      400,
      "ITEM_MISMATCH",
    );
  }

  const approvalMap = new Map(
    payload.items.map((item) => [String(item.drugId), item]),
  );

  const updatedItems = request.items.map((item) => {
    const approval = approvalMap.get(String(item.drugId));
    const approvedQuantity = approval.approvedQuantity;

    if (approvedQuantity > item.requestedQuantity) {
      throw new AppError(
        "Approved quantity cannot exceed requested quantity.",
        400,
        "INVALID_APPROVED_QUANTITY",
      );
    }

    if (
      approvedQuantity < item.requestedQuantity &&
      !approval.itemReason?.trim()
    ) {
      throw new AppError(
        "itemReason is required when approved quantity is reduced.",
        400,
        "ITEM_REASON_REQUIRED",
      );
    }

    if (approvedQuantity === 0 && !approval.itemReason?.trim()) {
      throw new AppError(
        "itemReason is required when an item is rejected.",
        400,
        "ITEM_REASON_REQUIRED",
      );
    }

    return {
      drugId: item.drugId,
      requestedQuantity: item.requestedQuantity,
      approvedQuantity,
      itemReason: approval.itemReason ?? "",
    };
  });

  const hasApprovedQty = updatedItems.some((item) => item.approvedQuantity > 0);

  if (!hasApprovedQty) {
    throw new AppError(
      "At least one item must have approved quantity greater than zero. Use reject instead.",
      400,
      "NO_APPROVED_ITEMS",
    );
  }

  const updated = await supplyRequestRepository.updateSupplyRequestById(id, {
    status: SUPPLY_REQUEST_STATUSES.APPROVED,
    items: updatedItems,
    approvedBy: actor._id,
    approvedAt: new Date(),
  });

  await recordAuditLog(actor, {
    action: AUDIT_ACTIONS.SUPPLY_REQUEST_APPROVE,
    entityType: "SupplyRequest",
    entityId: String(id),
  });

  await notifySupplyRequestUpdate({
    supplyRequest: updated,
    title: "Supply request approved",
    message: `Supply request ${id} was approved.`,
  });

  return toPublic(updated);
};

export const rejectSupplyRequest = async (actor, id, payload) => {
  const request = await getSupplyRequestOrThrow(id);

  if (!canAccessLocation(actor, request.sourceType, String(request.sourceId))) {
    throw new AppError(
      "You cannot reject requests for this source location.",
      403,
      "FORBIDDEN",
    );
  }

  if (request.status !== SUPPLY_REQUEST_STATUSES.PENDING_APPROVAL) {
    throw new AppError(
      "Only pending requests can be rejected.",
      400,
      "INVALID_STATUS",
    );
  }

  const updated = await supplyRequestRepository.updateSupplyRequestById(id, {
    status: SUPPLY_REQUEST_STATUSES.REJECTED,
    rejectionReason: payload.rejectionReason,
    approvedBy: actor._id,
    approvedAt: new Date(),
  });

  await recordAuditLog(actor, {
    action: AUDIT_ACTIONS.SUPPLY_REQUEST_REJECT,
    entityType: "SupplyRequest",
    entityId: String(id),
  });

  await notifySupplyRequestUpdate({
    supplyRequest: updated,
    title: "Supply request rejected",
    message: `Supply request ${id} was rejected.`,
  });

  return toPublic(updated);
};

export const cancelSupplyRequest = async (actor, id) => {
  const request = await getSupplyRequestOrThrow(id);

  if (
    !canAccessLocation(actor, request.requesterType, String(request.requesterId))
  ) {
    throw new AppError(
      "You cannot cancel this supply request.",
      403,
      "FORBIDDEN",
    );
  }

  if (request.status !== SUPPLY_REQUEST_STATUSES.PENDING_APPROVAL) {
    throw new AppError(
      "Only pending requests can be cancelled.",
      400,
      "INVALID_STATUS",
    );
  }

  const updated = await supplyRequestRepository.updateSupplyRequestById(id, {
    status: SUPPLY_REQUEST_STATUSES.CANCELLED,
    cancelledBy: actor._id,
    cancelledAt: new Date(),
  });

  return toPublic(updated);
};

export const assertApprovedSupplyRequest = async (id) => {
  const request = await getSupplyRequestOrThrow(id);

  if (request.status !== SUPPLY_REQUEST_STATUSES.APPROVED) {
    throw new AppError(
      "Supply request must be approved before creating a shipment.",
      400,
      "SUPPLY_REQUEST_NOT_APPROVED",
    );
  }

  return request;
};
