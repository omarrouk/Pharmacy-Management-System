import mongoose from "mongoose";
import { PHARMACY_RETURN_STATUS_VALUES } from "../../../constants/pharmacyReturn.js";

const pharmacyReturnItemSchema = new mongoose.Schema(
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

const pharmacyReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: PHARMACY_RETURN_STATUS_VALUES,
      default: "PREPARED",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [pharmacyReturnItemSchema],
      required: true,
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

pharmacyReturnSchema.index({ pharmacyId: 1, createdAt: -1 });
pharmacyReturnSchema.index({ warehouseId: 1, createdAt: -1 });
pharmacyReturnSchema.index({ status: 1, createdAt: -1 });

pharmacyReturnSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.pharmacyId = String(ret.pharmacyId);
    ret.warehouseId = String(ret.warehouseId);
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

export const PharmacyReturn = mongoose.model("PharmacyReturn", pharmacyReturnSchema);
