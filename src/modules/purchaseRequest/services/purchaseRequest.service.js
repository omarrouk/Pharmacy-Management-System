import mongoose from "mongoose";
import { ROLES } from "../../../constants/roles.js";
import { PURCHASE_REQUEST_STATUSES } from "../../../constants/purchaseRequest.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessWarehouse } from "../../../utils/scope.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import { assertActiveSupplier } from "../../supplier/services/supplier.service.js";
import * as warehouseRepository from "../../warehouse/repositories/warehouse.repository.js";
import { createPurchaseOrderFromRequest } from "../../purchaseOrder/services/purchaseOrder.service.js";
import * as purchaseRequestRepository from "../repositories/purchaseRequest.repository.js";

const toPublic = (doc) => doc.toJSON();

const MANAGER_ROLES = new Set([
  ROLES.SYSTEM_ADMIN,
  ROLES.PHARMACY_ADMIN,
  ROLES.WAREHOUSE_MANAGER,
]);

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

export const buildPurchaseRequestScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.warehouseIds?.length) {
    return { _id: null };
  }

  return { warehouseId: { $in: actor.warehouseIds } };
};

const getPurchaseRequestOrThrow = async (id) => {
  const request = await purchaseRequestRepository.findPurchaseRequestById(id);

  if (!request) {
    throw new AppError(
      "Purchase request was not found.",
      404,
      "PURCHASE_REQUEST_NOT_FOUND",
    );
  }

  return request;
};

const canAccessPurchaseRequest = (actor, request) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return true;
  }

  return canAccessWarehouse(actor, String(request.warehouseId));
};

const buildApprovedItems = (requestItems, approvalItems) => {
  const requestDrugIds = new Set(requestItems.map((item) => String(item.drugId)));
  const approvalMap = new Map(
    approvalItems.map((item) => [String(item.drugId), item]),
  );

  if (approvalItems.length !== requestDrugIds.size) {
    throw new AppError(
      "Approval items must match all drugs on the request.",
      400,
      "ITEM_MISMATCH",
    );
  }

  for (const drugId of requestDrugIds) {
    if (!approvalMap.has(drugId)) {
      throw new AppError(
        "Approval items must match all drugs on the request.",
        400,
        "ITEM_MISMATCH",
      );
    }
  }

  return requestItems.map((item) => {
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
      unitCost: approval.unitCost,
      itemReason: approval.itemReason ?? "",
    };
  });
};

const approveAndCreateOrder = async (requestId, approvedItems, actor, session) => {
  const hasApprovedQty = approvedItems.some((item) => item.approvedQuantity > 0);

  if (!hasApprovedQty) {
    throw new AppError(
      "At least one item must have approved quantity greater than zero.",
      400,
      "NO_APPROVED_ITEMS",
    );
  }

  const updated = await purchaseRequestRepository.updatePurchaseRequestById(
    requestId,
    {
      status: PURCHASE_REQUEST_STATUSES.APPROVED,
      items: approvedItems,
      approvedBy: actor._id,
      approvedAt: new Date(),
    },
    session,
  );

  const order = await createPurchaseOrderFromRequest(updated, actor, session);

  return { request: toPublic(updated), purchaseOrder: order.toJSON() };
};

export const createPurchaseRequest = async (actor, payload) => {
  if (!canAccessWarehouse(actor, payload.warehouseId)) {
    throw new AppError("You cannot access this warehouse.", 403, "FORBIDDEN");
  }

  const warehouse = await warehouseRepository.findWarehouseById(payload.warehouseId);

  if (!warehouse || !warehouse.isActive) {
    throw new AppError("Warehouse was not found or is inactive.", 400, "INVALID_WAREHOUSE");
  }

  await assertActiveSupplier(payload.supplierId);
  assertUniqueDrugItems(payload.items);
  await Promise.all(payload.items.map((item) => assertDrugExists(item.drugId)));

  const requestItems = payload.items.map((item) => ({
    drugId: item.drugId,
    requestedQuantity: item.requestedQuantity,
    approvedQuantity: null,
    unitCost: item.unitCost ?? null,
    itemReason: "",
  }));

  const canSelfApprove =
    MANAGER_ROLES.has(actor.role) &&
    requestItems.every((item) => item.unitCost !== null && item.unitCost !== undefined);

  if (canSelfApprove) {
    const session = await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        const request = await purchaseRequestRepository.createPurchaseRequest(
          {
            warehouseId: payload.warehouseId,
            supplierId: payload.supplierId,
            status: PURCHASE_REQUEST_STATUSES.PENDING_APPROVAL,
            items: requestItems,
            createdBy: actor._id,
          },
          session,
        );

        const approvalPayload = request.items.map((item) => ({
          drugId: String(item.drugId),
          approvedQuantity: item.requestedQuantity,
          unitCost: item.unitCost,
          itemReason: "",
        }));

        result = await approveAndCreateOrder(
          request._id,
          buildApprovedItems(request.items, approvalPayload),
          actor,
          session,
        );
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  const request = await purchaseRequestRepository.createPurchaseRequest({
    warehouseId: payload.warehouseId,
    supplierId: payload.supplierId,
    status: PURCHASE_REQUEST_STATUSES.PENDING_APPROVAL,
    items: requestItems,
    createdBy: actor._id,
  });

  return { request: toPublic(request), purchaseOrder: null };
};

export const listPurchaseRequests = async (
  actor,
  { page, limit, status, warehouseId, supplierId },
) => {
  const filter = { ...buildPurchaseRequestScopeFilter(actor) };

  if (status) filter.status = status;
  if (warehouseId) filter.warehouseId = warehouseId;
  if (supplierId) filter.supplierId = supplierId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    purchaseRequestRepository.listPurchaseRequests({ filter, skip, limit }),
    purchaseRequestRepository.countPurchaseRequests(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getPurchaseRequestById = async (actor, id) => {
  const request = await getPurchaseRequestOrThrow(id);

  if (!canAccessPurchaseRequest(actor, request)) {
    throw new AppError("You cannot access this purchase request.", 403, "FORBIDDEN");
  }

  return toPublic(request);
};

export const approvePurchaseRequest = async (actor, id, payload) => {
  const request = await getPurchaseRequestOrThrow(id);

  if (!canAccessWarehouse(actor, String(request.warehouseId))) {
    throw new AppError("You cannot approve this purchase request.", 403, "FORBIDDEN");
  }

  if (request.status !== PURCHASE_REQUEST_STATUSES.PENDING_APPROVAL) {
    throw new AppError("Only pending requests can be approved.", 400, "INVALID_STATUS");
  }

  const approvedItems = buildApprovedItems(request.items, payload.items);
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await approveAndCreateOrder(id, approvedItems, actor, session);
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const rejectPurchaseRequest = async (actor, id, payload) => {
  const request = await getPurchaseRequestOrThrow(id);

  if (!canAccessWarehouse(actor, String(request.warehouseId))) {
    throw new AppError("You cannot reject this purchase request.", 403, "FORBIDDEN");
  }

  if (request.status !== PURCHASE_REQUEST_STATUSES.PENDING_APPROVAL) {
    throw new AppError("Only pending requests can be rejected.", 400, "INVALID_STATUS");
  }

  const updated = await purchaseRequestRepository.updatePurchaseRequestById(id, {
    status: PURCHASE_REQUEST_STATUSES.REJECTED,
    rejectionReason: payload.rejectionReason,
    approvedBy: actor._id,
    approvedAt: new Date(),
  });

  return toPublic(updated);
};

export const cancelPurchaseRequest = async (actor, id) => {
  const request = await getPurchaseRequestOrThrow(id);

  if (!canAccessWarehouse(actor, String(request.warehouseId))) {
    throw new AppError("You cannot cancel this purchase request.", 403, "FORBIDDEN");
  }

  if (request.status !== PURCHASE_REQUEST_STATUSES.PENDING_APPROVAL) {
    throw new AppError("Only pending requests can be cancelled.", 400, "INVALID_STATUS");
  }

  const updated = await purchaseRequestRepository.updatePurchaseRequestById(id, {
    status: PURCHASE_REQUEST_STATUSES.CANCELLED,
    cancelledBy: actor._id,
    cancelledAt: new Date(),
  });

  return toPublic(updated);
};
