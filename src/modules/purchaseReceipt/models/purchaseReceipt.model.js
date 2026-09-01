import mongoose from "mongoose";

const purchaseReceiptItemSchema = new mongoose.Schema(
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

const purchaseReceiptSchema = new mongoose.Schema(
  {
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
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [purchaseReceiptItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

purchaseReceiptSchema.index({ purchaseOrderId: 1, createdAt: -1 });
purchaseReceiptSchema.index({ warehouseId: 1, createdAt: -1 });
purchaseReceiptSchema.index({ invoiceNumber: 1 }, { unique: true });

purchaseReceiptSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.purchaseOrderId = String(ret.purchaseOrderId);
    ret.warehouseId = String(ret.warehouseId);
    ret.supplierId = String(ret.supplierId);
    ret.receivedBy = String(ret.receivedBy);

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

export const PurchaseReceipt = mongoose.model(
  "PurchaseReceipt",
  purchaseReceiptSchema,
);
