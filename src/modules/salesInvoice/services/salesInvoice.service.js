import mongoose from "mongoose";
import { DISCOUNT_TYPES } from "../../../constants/sales.js";
import { ROLES } from "../../../constants/roles.js";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_TYPES,
} from "../../../constants/stockMovement.js";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessPharmacy } from "../../../utils/scope.js";
import { hasPermission } from "../../../constants/permissions.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as inventoryRepository from "../../inventory/repositories/inventory.repository.js";
import { assertActivePaymentMethod } from "../../paymentMethod/services/paymentMethod.service.js";
import * as pharmacyRepository from "../../pharmacy/repositories/pharmacy.repository.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import * as salesInvoiceRepository from "../repositories/salesInvoice.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildSalesInvoiceScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.pharmacyIds?.length) {
    return { _id: null };
  }

  return { pharmacyId: { $in: actor.pharmacyIds } };
};

const roundMoney = (value) => Math.round(value * 100) / 100;

const computeLineAmounts = (quantity, unitPrice, discountType, discountValue) => {
  const gross = roundMoney(quantity * unitPrice);
  let discountAmount = 0;

  if (discountType && discountValue > 0) {
    if (discountType === DISCOUNT_TYPES.PERCENTAGE) {
      discountAmount = roundMoney(gross * (discountValue / 100));
    } else {
      discountAmount = roundMoney(discountValue);
    }

    discountAmount = Math.min(discountAmount, gross);
  }

  return {
    gross,
    discountAmount,
    lineTotal: roundMoney(gross - discountAmount),
  };
};

const assertDiscountPermission = (actor, discountType, discountValue) => {
  if (discountType && discountValue > 0) {
    if (!hasPermission(actor.role, PERMISSIONS.SALES_APPLY_DISCOUNT)) {
      throw new AppError(
        "You are not allowed to apply discounts.",
        403,
        "DISCOUNT_FORBIDDEN",
      );
    }
  }
};

const allocateFromBatch = async (pharmacyId, drugId, batchId, quantity) => {
  const batch = await batchRepository.findBatchById(batchId);

  if (!batch || !batch.isActive) {
    throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
  }

  if (String(batch.drugId) !== String(drugId)) {
    throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
  }

  const rows = await inventoryRepository.listPharmacyInventoryFefo(pharmacyId, drugId);
  const row = rows.find((entry) => String(entry.batchId) === String(batchId));

  if (!row || row.quantity < quantity) {
    throw new AppError("Insufficient stock.", 400, "INSUFFICIENT_STOCK");
  }

  return [{ batchId, quantity }];
};

const allocateFefo = async (pharmacyId, drugId, quantity) => {
  const rows = await inventoryRepository.listPharmacyInventoryFefo(pharmacyId, drugId);
  let remaining = quantity;
  const allocations = [];

  for (const row of rows) {
    if (remaining <= 0) break;

    const take = Math.min(row.quantity, remaining);
    allocations.push({ batchId: row.batchId, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new AppError("Insufficient stock.", 400, "INSUFFICIENT_STOCK");
  }

  return allocations;
};

const generateInvoiceNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `SALE-${date}-`;
  const count = await salesInvoiceRepository.countSalesInvoicesWithPrefix(prefix);

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

const resolveLineAllocations = async (pharmacyId, item) => {
  if (item.batchId) {
    return allocateFromBatch(pharmacyId, item.drugId, item.batchId, item.quantity);
  }

  return allocateFefo(pharmacyId, item.drugId, item.quantity);
};

export const createSalesInvoice = async (actor, payload) => {
  if (!canAccessPharmacy(actor, payload.pharmacyId)) {
    throw new AppError("You cannot sell from this pharmacy.", 403, "FORBIDDEN");
  }

  const pharmacy = await pharmacyRepository.findPharmacyById(payload.pharmacyId);

  if (!pharmacy || !pharmacy.isActive) {
    throw new AppError("Pharmacy was not found or is inactive.", 400, "INVALID_PHARMACY");
  }

  await assertActivePaymentMethod(payload.paymentMethodId);

  const resolvedLines = [];

  for (const item of payload.items) {
    assertDiscountPermission(actor, item.discountType, item.discountValue ?? 0);

    const drug = await drugRepository.findDrugById(item.drugId);

    if (!drug || !drug.isActive) {
      throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
    }

    const allocations = await resolveLineAllocations(payload.pharmacyId, item);
    const itemAmounts = computeLineAmounts(
      item.quantity,
      drug.sellingPrice,
      item.discountType,
      item.discountValue ?? 0,
    );

    for (const allocation of allocations) {
      const portion = allocation.quantity / item.quantity;
      const gross = roundMoney(allocation.quantity * drug.sellingPrice);
      const discountAmount = roundMoney(itemAmounts.discountAmount * portion);
      const lineTotal = roundMoney(gross - discountAmount);

      resolvedLines.push({
        drugId: drug._id,
        batchId: allocation.batchId,
        quantity: allocation.quantity,
        unitPrice: drug.sellingPrice,
        discountType: item.discountType ?? null,
        discountValue: item.discountValue ?? 0,
        discountAmount,
        lineTotal,
        gross,
      });
    }
  }

  const subtotal = roundMoney(
    resolvedLines.reduce((sum, line) => sum + line.gross, 0),
  );
  const discountTotal = roundMoney(
    resolvedLines.reduce((sum, line) => sum + line.discountAmount, 0),
  );
  const totalAmount = roundMoney(
    resolvedLines.reduce((sum, line) => sum + line.lineTotal, 0),
  );

  const session = await mongoose.startSession();

  try {
    let invoice;

    await session.withTransaction(async () => {
      const invoiceNumber = await generateInvoiceNumber();

      for (const line of resolvedLines) {
        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.SALE,
            direction: MOVEMENT_DIRECTIONS.OUT,
            drugId: String(line.drugId),
            batchId: String(line.batchId),
            quantity: line.quantity,
            locationType: LOCATION_TYPES.PHARMACY,
            locationId: String(payload.pharmacyId),
            reference: invoiceNumber,
          },
          actor,
          session,
        );
      }

      invoice = await salesInvoiceRepository.createSalesInvoice(
        {
          invoiceNumber,
          pharmacyId: payload.pharmacyId,
          paymentMethodId: payload.paymentMethodId,
          customer: payload.customer ?? {},
          items: resolvedLines.map(({ gross: _gross, ...item }) => item),
          subtotal,
          discountTotal,
          totalAmount,
          createdBy: actor._id,
        },
        session,
      );
    });

    return toPublic(invoice);
  } finally {
    await session.endSession();
  }
};

export const listSalesInvoices = async (actor, { page, limit, pharmacyId }) => {
  const filter = { ...buildSalesInvoiceScopeFilter(actor) };

  if (pharmacyId) {
    if (!canAccessPharmacy(actor, pharmacyId)) {
      throw new AppError("You cannot access this pharmacy.", 403, "FORBIDDEN");
    }

    filter.pharmacyId = pharmacyId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    salesInvoiceRepository.listSalesInvoices({ filter, skip, limit }),
    salesInvoiceRepository.countSalesInvoices(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getSalesInvoiceById = async (actor, id) => {
  const invoice = await salesInvoiceRepository.findSalesInvoiceById(id);

  if (!invoice) {
    throw new AppError("Sales invoice was not found.", 404, "SALES_INVOICE_NOT_FOUND");
  }

  if (!canAccessPharmacy(actor, String(invoice.pharmacyId))) {
    throw new AppError("You cannot access this sales invoice.", 403, "FORBIDDEN");
  }

  return toPublic(invoice);
};
