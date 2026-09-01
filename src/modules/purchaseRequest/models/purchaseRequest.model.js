import mongoose from "mongoose";
import { PURCHASE_REQUEST_STATUS_VALUES } from "../../../constants/purchaseRequest.js";

const purchaseRequestItemSchema = new mongoose.Schema(
  {
    drugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    approvedQuantity: {
      type: Number,
      min: 0,
      default: null,
    },
    unitCost: {
      type: Number,
      min: 0,
      default: null,
    },
    itemReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const purchaseRequestSchema = new mongoose.Schema(
  {
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
      enum: PURCHASE_REQUEST_STATUS_VALUES,
      default: "PENDING_APPROVAL",
    },
    items: {
      type: [purchaseRequestItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one item is required.",
      },
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

purchaseRequestSchema.index({ warehouseId: 1, status: 1, createdAt: -1 });
purchaseRequestSchema.index({ supplierId: 1, createdAt: -1 });

purchaseRequestSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.warehouseId = String(ret.warehouseId);
    ret.supplierId = String(ret.supplierId);
    ret.createdBy = String(ret.createdBy);

    if (ret.approvedBy) ret.approvedBy = String(ret.approvedBy);
    if (ret.cancelledBy) ret.cancelledBy = String(ret.cancelledBy);

    ret.items = ret.items.map((item) => ({
      drugId: String(item.drugId),
      requestedQuantity: item.requestedQuantity,
      approvedQuantity: item.approvedQuantity,
      unitCost: item.unitCost,
      itemReason: item.itemReason ?? "",
    }));

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PurchaseRequest = mongoose.model(
  "PurchaseRequest",
  purchaseRequestSchema,
);
