import mongoose from "mongoose";
import { PURCHASE_ORDER_STATUS_VALUES } from "../../../constants/purchaseOrder.js";

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    drugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    purchaseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequest",
      required: true,
      unique: true,
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
    status: {
      type: String,
      required: true,
      enum: PURCHASE_ORDER_STATUS_VALUES,
      default: "OPEN",
    },
    items: {
      type: [purchaseOrderItemSchema],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

purchaseOrderSchema.index({ warehouseId: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ supplierId: 1, createdAt: -1 });

purchaseOrderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.purchaseRequestId = String(ret.purchaseRequestId);
    ret.warehouseId = String(ret.warehouseId);
    ret.supplierId = String(ret.supplierId);
    ret.createdBy = String(ret.createdBy);

    ret.items = ret.items.map((item) => ({
      drugId: String(item.drugId),
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      unitCost: item.unitCost,
    }));

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
