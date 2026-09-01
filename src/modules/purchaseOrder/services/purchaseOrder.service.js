import { ROLES } from "../../../constants/roles.js";
import { PURCHASE_ORDER_STATUSES } from "../../../constants/purchaseOrder.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessWarehouse } from "../../../utils/scope.js";
import * as purchaseOrderRepository from "../repositories/purchaseOrder.repository.js";

const toPublic = (doc) => doc.toJSON();

const generateOrderNumber = async () => {
  const count = await purchaseOrderRepository.countPurchaseOrdersForNumber();
  return `PO-${String(count + 1).padStart(6, "0")}`;
};

const canAccessPurchaseOrder = (actor, order) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return true;
  }

  return canAccessWarehouse(actor, String(order.warehouseId));
};

export const buildPurchaseOrderScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.warehouseIds?.length) {
    return { _id: null };
  }

  return { warehouseId: { $in: actor.warehouseIds } };
};

export const createPurchaseOrderFromRequest = async (request, actor, session) => {
  const existing = await purchaseOrderRepository.findPurchaseOrderByRequestId(
    request._id,
  );

  if (existing) {
    throw new AppError(
      "Purchase order already exists for this request.",
      409,
      "PURCHASE_ORDER_EXISTS",
    );
  }

  const orderItems = request.items
    .filter((item) => item.approvedQuantity > 0)
    .map((item) => ({
      drugId: item.drugId,
      orderedQuantity: item.approvedQuantity,
      receivedQuantity: 0,
      unitCost: item.unitCost,
    }));

  if (!orderItems.length) {
    throw new AppError(
      "Cannot create purchase order without approved items.",
      400,
      "NO_APPROVED_ITEMS",
    );
  }

  const orderNumber = await generateOrderNumber();

  const order = await purchaseOrderRepository.createPurchaseOrder(
    {
      orderNumber,
      purchaseRequestId: request._id,
      warehouseId: request.warehouseId,
      supplierId: request.supplierId,
      status: PURCHASE_ORDER_STATUSES.OPEN,
      items: orderItems,
      createdBy: actor._id,
    },
    session,
  );

  return order;
};

export const listPurchaseOrders = async (
  actor,
  { page, limit, status, warehouseId, supplierId },
) => {
  const filter = buildPurchaseOrderScopeFilter(actor);

  if (status) filter.status = status;
  if (warehouseId) filter.warehouseId = warehouseId;
  if (supplierId) filter.supplierId = supplierId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    purchaseOrderRepository.listPurchaseOrders({ filter, skip, limit }),
    purchaseOrderRepository.countPurchaseOrders(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getPurchaseOrderOrThrow = async (id) => {
  const order = await purchaseOrderRepository.findPurchaseOrderById(id);

  if (!order) {
    throw new AppError("Purchase order was not found.", 404, "PURCHASE_ORDER_NOT_FOUND");
  }

  return order;
};

export const getPurchaseOrderById = async (actor, id) => {
  const order = await getPurchaseOrderOrThrow(id);

  if (!canAccessPurchaseOrder(actor, order)) {
    throw new AppError("You cannot access this purchase order.", 403, "FORBIDDEN");
  }

  return toPublic(order);
};

export const updateOrderAfterReceipt = async (order, receiptItems, session) => {
  const receivedByDrug = new Map();

  for (const item of receiptItems) {
    const key = String(item.drugId);
    receivedByDrug.set(key, (receivedByDrug.get(key) ?? 0) + item.quantity);
  }

  const updatedItems = order.items.map((item) => {
    const add = receivedByDrug.get(String(item.drugId)) ?? 0;

    return {
      drugId: item.drugId,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity + add,
      unitCost: item.unitCost,
    };
  });

  const fullyReceived = updatedItems.every(
    (item) => item.receivedQuantity >= item.orderedQuantity,
  );
  const anyReceived = updatedItems.some((item) => item.receivedQuantity > 0);

  let status = order.status;

  if (fullyReceived) {
    status = PURCHASE_ORDER_STATUSES.RECEIVED;
  } else if (anyReceived) {
    status = PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED;
  }

  return purchaseOrderRepository.updatePurchaseOrderById(
    order._id,
    { items: updatedItems, status },
    session,
  );
};
