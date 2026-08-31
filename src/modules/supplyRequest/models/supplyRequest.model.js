import mongoose from "mongoose";
import { LOCATION_TYPE_VALUES } from "../../../constants/stockMovement.js";
import {
  SUPPLY_REQUEST_STATUS_VALUES,
  SUPPLY_REQUEST_TYPE_VALUES,
} from "../../../constants/supplyRequest.js";

const supplyRequestItemSchema = new mongoose.Schema(
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
    itemReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const supplyRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: true,
      enum: SUPPLY_REQUEST_TYPE_VALUES,
    },
    requesterType: {
      type: String,
      required: true,
      enum: LOCATION_TYPE_VALUES,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: LOCATION_TYPE_VALUES,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    destinationType: {
      type: String,
      required: true,
      enum: LOCATION_TYPE_VALUES,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: SUPPLY_REQUEST_STATUS_VALUES,
      default: "PENDING_APPROVAL",
    },
    items: {
      type: [supplyRequestItemSchema],
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

supplyRequestSchema.index({ status: 1, createdAt: -1 });
supplyRequestSchema.index({ sourceType: 1, sourceId: 1, status: 1 });
supplyRequestSchema.index({ destinationType: 1, destinationId: 1, status: 1 });
supplyRequestSchema.index({ requesterType: 1, requesterId: 1, createdAt: -1 });

const stringifyItem = (item) => ({
  drugId: String(item.drugId),
  requestedQuantity: item.requestedQuantity,
  approvedQuantity: item.approvedQuantity,
  itemReason: item.itemReason ?? "",
});

supplyRequestSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.requesterId = String(ret.requesterId);
    ret.sourceId = String(ret.sourceId);
    ret.destinationId = String(ret.destinationId);
    ret.createdBy = String(ret.createdBy);

    if (ret.approvedBy) {
      ret.approvedBy = String(ret.approvedBy);
    }

    if (ret.cancelledBy) {
      ret.cancelledBy = String(ret.cancelledBy);
    }

    ret.items = ret.items.map(stringifyItem);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const SupplyRequest = mongoose.model("SupplyRequest", supplyRequestSchema);
