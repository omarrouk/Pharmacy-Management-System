import mongoose from "mongoose";

const purchaseInvoiceItemSchema = new mongoose.Schema(
  {
    drugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    purchaseReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseReceipt",
      required: true,
      unique: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: {
      type: [purchaseInvoiceItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

purchaseInvoiceSchema.index({ warehouseId: 1, createdAt: -1 });
purchaseInvoiceSchema.index({ supplierId: 1, createdAt: -1 });

purchaseInvoiceSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.purchaseReceiptId = String(ret.purchaseReceiptId);
    ret.purchaseOrderId = String(ret.purchaseOrderId);
    ret.warehouseId = String(ret.warehouseId);
    ret.supplierId = String(ret.supplierId);
    ret.createdBy = String(ret.createdBy);

    ret.items = ret.items.map((item) => ({
      drugId: String(item.drugId),
      batchId: String(item.batchId),
      quantity: item.quantity,
      unitCost: item.unitCost,
      lineTotal: item.lineTotal,
    }));

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PurchaseInvoice = mongoose.model(
  "PurchaseInvoice",
  purchaseInvoiceSchema,
);
