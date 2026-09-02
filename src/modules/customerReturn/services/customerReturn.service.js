import mongoose from "mongoose";
import { ROLES } from "../../../constants/roles.js";
import {
  LOCATION_TYPES,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_TYPES,
} from "../../../constants/stockMovement.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessPharmacy } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import * as salesInvoiceRepository from "../../salesInvoice/repositories/salesInvoice.repository.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import * as customerReturnRepository from "../repositories/customerReturn.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildCustomerReturnScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.pharmacyIds?.length) {
    return { _id: null };
  }

  return { pharmacyId: { $in: actor.pharmacyIds } };
};

const generateReturnNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `CRET-${date}-`;
  const count = await customerReturnRepository.countCustomerReturnsWithPrefix(prefix);

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

const getInvoiceLineMap = (invoice) => {
  const map = new Map();

  for (const item of invoice.items) {
    const key = `${String(item.drugId)}:${String(item.batchId)}`;
    map.set(key, item.quantity);
  }

  return map;
};

const getReturnedMap = async (salesInvoiceId) => {
  const rows =
    await customerReturnRepository.sumReturnedQuantitiesByInvoice(salesInvoiceId);

  return new Map(
    rows.map((row) => [
      `${String(row._id.drugId)}:${String(row._id.batchId)}`,
      row.totalReturned,
    ]),
  );
};

export const createCustomerReturn = async (actor, payload) => {
  const invoice = await salesInvoiceRepository.findSalesInvoiceById(
    payload.salesInvoiceId,
  );

  if (!invoice) {
    throw new AppError("Sales invoice was not found.", 404, "SALES_INVOICE_NOT_FOUND");
  }

  if (!canAccessPharmacy(actor, String(invoice.pharmacyId))) {
    throw new AppError("You cannot return for this pharmacy.", 403, "FORBIDDEN");
  }

  const invoiceLineMap = getInvoiceLineMap(invoice);
  const returnedMap = await getReturnedMap(String(invoice._id));
  const incomingMap = new Map();

  for (const item of payload.items) {
    const batch = await batchRepository.findBatchById(item.batchId);

    if (!batch || !batch.isActive) {
      throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
    }

    if (String(batch.drugId) !== String(item.drugId)) {
      throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
    }

    const key = `${String(item.drugId)}:${String(item.batchId)}`;

    if (!invoiceLineMap.has(key)) {
      throw new AppError(
        "Item was not sold on this invoice.",
        400,
        "ITEM_NOT_ON_INVOICE",
      );
    }

    incomingMap.set(key, (incomingMap.get(key) ?? 0) + item.quantity);
  }

  for (const [key, incomingQty] of incomingMap) {
    const soldQty = invoiceLineMap.get(key);
    const alreadyReturned = returnedMap.get(key) ?? 0;

    if (alreadyReturned + incomingQty > soldQty) {
      throw new AppError(
        "Return quantity exceeds sold quantity.",
        400,
        "EXCEEDS_SOLD_QUANTITY",
      );
    }
  }

  const session = await mongoose.startSession();

  try {
    let customerReturn;

    await session.withTransaction(async () => {
      const returnNumber = await generateReturnNumber();
      const reference = `customerReturn:${returnNumber}`;

      for (const item of payload.items) {
        await applyStockMovement(
          {
            movementType: MOVEMENT_TYPES.CUSTOMER_RETURN,
            direction: MOVEMENT_DIRECTIONS.IN,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.quantity,
            locationType: LOCATION_TYPES.PHARMACY,
            locationId: String(invoice.pharmacyId),
            reference,
          },
          actor,
          session,
        );
      }

      customerReturn = await customerReturnRepository.createCustomerReturn(
        {
          returnNumber,
          salesInvoiceId: invoice._id,
          pharmacyId: invoice.pharmacyId,
          items: payload.items,
          createdBy: actor._id,
        },
        session,
      );
    });

    return toPublic(customerReturn);
  } finally {
    await session.endSession();
  }
};

export const listCustomerReturns = async (
  actor,
  { page, limit, pharmacyId, salesInvoiceId },
) => {
  const filter = { ...buildCustomerReturnScopeFilter(actor) };

  if (pharmacyId) {
    if (!canAccessPharmacy(actor, pharmacyId)) {
      throw new AppError("You cannot access this pharmacy.", 403, "FORBIDDEN");
    }

    filter.pharmacyId = pharmacyId;
  }

  if (salesInvoiceId) {
    filter.salesInvoiceId = salesInvoiceId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    customerReturnRepository.listCustomerReturns({ filter, skip, limit }),
    customerReturnRepository.countCustomerReturns(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getCustomerReturnById = async (actor, id) => {
  const customerReturn = await customerReturnRepository.findCustomerReturnById(id);

  if (!customerReturn) {
    throw new AppError("Customer return was not found.", 404, "CUSTOMER_RETURN_NOT_FOUND");
  }

  if (!canAccessPharmacy(actor, String(customerReturn.pharmacyId))) {
    throw new AppError("You cannot access this customer return.", 403, "FORBIDDEN");
  }

  return toPublic(customerReturn);
};
