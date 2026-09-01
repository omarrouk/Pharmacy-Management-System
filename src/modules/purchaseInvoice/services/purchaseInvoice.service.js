import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessWarehouse } from "../../../utils/scope.js";
import * as purchaseInvoiceRepository from "../repositories/purchaseInvoice.repository.js";

const toPublic = (doc) => doc.toJSON();

export const buildPurchaseInvoiceScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  if (!actor.warehouseIds?.length) {
    return { _id: null };
  }

  return { warehouseId: { $in: actor.warehouseIds } };
};

export const listPurchaseInvoices = async (
  actor,
  { page, limit, warehouseId, supplierId },
) => {
  const filter = { ...buildPurchaseInvoiceScopeFilter(actor) };

  if (warehouseId) filter.warehouseId = warehouseId;
  if (supplierId) filter.supplierId = supplierId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    purchaseInvoiceRepository.listPurchaseInvoices({ filter, skip, limit }),
    purchaseInvoiceRepository.countPurchaseInvoices(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getPurchaseInvoiceById = async (actor, id) => {
  const invoice = await purchaseInvoiceRepository.findPurchaseInvoiceById(id);

  if (!invoice) {
    throw new AppError("Purchase invoice was not found.", 404, "PURCHASE_INVOICE_NOT_FOUND");
  }

  if (!canAccessWarehouse(actor, String(invoice.warehouseId))) {
    throw new AppError("You cannot access this purchase invoice.", 403, "FORBIDDEN");
  }

  return toPublic(invoice);
};
