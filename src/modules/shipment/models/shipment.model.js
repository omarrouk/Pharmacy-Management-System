import mongoose from "mongoose";
import { LOCATION_TYPE_VALUES } from "../../../constants/stockMovement.js";
import { SHIPMENT_STATUS_VALUES } from "../../../constants/shipment.js";

const shipmentItemSchema = new mongoose.Schema(
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
    sentQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    shortageQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const shipmentSchema = new mongoose.Schema(
  {
    supplyRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplyRequest",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: SHIPMENT_STATUS_VALUES,
      default: "PREPARED",
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
    items: {
      type: [shipmentItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one item is required.",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

shipmentSchema.index({ supplyRequestId: 1, createdAt: -1 });
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ sourceType: 1, sourceId: 1, status: 1 });
shipmentSchema.index({ destinationType: 1, destinationId: 1, status: 1 });

shipmentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.supplyRequestId = String(ret.supplyRequestId);
    ret.sourceId = String(ret.sourceId);
    ret.destinationId = String(ret.destinationId);
    ret.createdBy = String(ret.createdBy);

    if (ret.sentBy) {
      ret.sentBy = String(ret.sentBy);
    }

    if (ret.receivedBy) {
      ret.receivedBy = String(ret.receivedBy);
    }

    ret.items = ret.items.map((item) => ({
      drugId: String(item.drugId),
      batchId: String(item.batchId),
      sentQuantity: item.sentQuantity,
      receivedQuantity: item.receivedQuantity,
      shortageQuantity: item.shortageQuantity,
    }));

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Shipment = mongoose.model("Shipment", shipmentSchema);
