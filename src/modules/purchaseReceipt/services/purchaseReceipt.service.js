import mongoose from "mongoose";
import { ROLES } from "../../../constants/roles.js";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_TYPES,
} from "../../../constants/stockMovement.js";
import { PURCHASE_ORDER_STATUSES } from "../../../constants/purchaseOrder.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessWarehouse } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import { createPurchaseInvoice } from "../../purchaseInvoice/repositories/purchaseInvoice.repository.js";
import {
  getPurchaseOrderOrThrow,
  updateOrderAfterReceipt,
} from "../../purchaseOrder/services/purchaseOrder.service.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import { getSupplierById } from "../../supplier/services/supplier.service.js";
import * as purchaseReceiptRepository from "../repositories/purchaseReceipt.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildPurchaseReceiptScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.warehouseIds?.length) {
    return { _id: null };
  }

  return { warehouseId: { $in: actor.warehouseIds } };
};

const resolveBatch = async (item, supplierName, invoiceNumber, session) => {
  if (item.batchId) {
    const batch = await batchRepository.findBatchById(item.batchId);

    if (!batch || !batch.isActive) {
      throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
    }

    if (String(batch.drugId) !== String(item.drugId)) {
      throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
    }

    return batch;
  }

  const batchNumber = item.batchNumber.toUpperCase();
  const existing = await batchRepository.findBatchByDrugAndNumber(
    item.drugId,
    batchNumber,
  );

  if (existing) {
    return existing;
  }

  const batch = await batchRepository.createBatch(
    {
      drugId: item.drugId,
      batchNumber,
      expiryDate: item.expiryDate,
      source: supplierName,
      receiptReference: invoiceNumber,
    },
    session,
  );

  return batch;
};

const validateReceiptAgainstOrder = (order, receiptItems) => {
  const orderMap = new Map(
    order.items.map((item) => [String(item.drugId), item]),
  );
  const incomingByDrug = new Map();

  for (const item of receiptItems) {
    const drugKey = String(item.drugId);
    const orderItem = orderMap.get(drugKey);

    if (!orderItem) {
      throw new AppError("Drug is not on this purchase order.", 400, "DRUG_NOT_ON_ORDER");
    }

    incomingByDrug.set(drugKey, (incomingByDrug.get(drugKey) ?? 0) + item.quantity);
  }

  for (const [drugId, incomingQty] of incomingByDrug) {
    const orderItem = orderMap.get(drugId);
    const remaining = orderItem.orderedQuantity - orderItem.receivedQuantity;

    if (incomingQty > remaining) {
      throw new AppError(
        "Received quantity exceeds remaining ordered quantity.",
        400,
        "EXCEEDS_ORDERED_QUANTITY",
      );
    }
  }
};

export const receivePurchase = async (actor, payload) => {
  const order = await getPurchaseOrderOrThrow(payload.purchaseOrderId);

  if (!canAccessWarehouse(actor, String(order.warehouseId))) {
    throw new AppError("You cannot receive for this warehouse.", 403, "FORBIDDEN");
  }

  if (
    order.status !== PURCHASE_ORDER_STATUSES.OPEN &&
    order.status !== PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
  ) {
    throw new AppError(
      "Purchase order is not open for receiving.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }

  const existingInvoice =
    await purchaseReceiptRepository.findPurchaseReceiptByInvoiceNumber(
      payload.invoiceNumber,
    );

  if (existingInvoice) {
    throw new AppError("Invoice number is already in use.", 409, "INVOICE_IN_USE");
  }

  for (const item of payload.items) {
    const drug = await drugRepository.findDrugById(item.drugId);

    if (!drug || !drug.isActive) {
      throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
    }
  }

  validateReceiptAgainstOrder(order, payload.items);

  const supplier = await getSupplierById(String(order.supplierId));
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const receiptItems = [];

      for (const item of payload.items) {
        const batch = await resolveBatch(
          item,
          supplier.name,
          payload.invoiceNumber,
          session,
        );

        const lineTotal = item.quantity * item.unitCost;

        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.PURCHASE_RECEIVING,
            direction: MOVEMENT_DIRECTIONS.IN,
            drugId: String(item.drugId),
            batchId: String(batch._id),
            quantity: item.quantity,
            locationType: LOCATION_TYPES.WAREHOUSE,
            locationId: String(order.warehouseId),
            reference: `purchase:${payload.invoiceNumber}`,
          },
          actor,
          session,
        );

        receiptItems.push({
          drugId: item.drugId,
          batchId: batch._id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineTotal,
        });
      }

      const totalAmount = receiptItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );

      const receipt = await purchaseReceiptRepository.createPurchaseReceipt(
        {
          purchaseOrderId: order._id,
          warehouseId: order.warehouseId,
          supplierId: order.supplierId,
          invoiceNumber: payload.invoiceNumber,
          items: receiptItems,
          totalAmount,
          receivedBy: actor._id,
        },
        session,
      );

      const invoice = await createPurchaseInvoice(
        {
          invoiceNumber: payload.invoiceNumber,
          purchaseReceiptId: receipt._id,
          purchaseOrderId: order._id,
          warehouseId: order.warehouseId,
          supplierId: order.supplierId,
          items: receiptItems,
          totalAmount,
          createdBy: actor._id,
        },
        session,
      );

      await updateOrderAfterReceipt(order, receiptItems, session);

      result = {
        receipt: toPublic(receipt),
        invoice: toPublic(invoice),
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const listPurchaseReceipts = async (
  actor,
  { page, limit, purchaseOrderId, warehouseId },
) => {
  const filter = { ...buildPurchaseReceiptScopeFilter(actor) };

  if (purchaseOrderId) filter.purchaseOrderId = purchaseOrderId;
  if (warehouseId) filter.warehouseId = warehouseId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    purchaseReceiptRepository.listPurchaseReceipts({ filter, skip, limit }),
    purchaseReceiptRepository.countPurchaseReceipts(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getPurchaseReceiptById = async (actor, id) => {
  const receipt = await purchaseReceiptRepository.findPurchaseReceiptById(id);

  if (!receipt) {
    throw new AppError("Purchase receipt was not found.", 404, "PURCHASE_RECEIPT_NOT_FOUND");
  }

  if (!canAccessWarehouse(actor, String(receipt.warehouseId))) {
    throw new AppError("You cannot access this purchase receipt.", 403, "FORBIDDEN");
  }

  return toPublic(receipt);
};
