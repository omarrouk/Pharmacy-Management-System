import mongoose from "mongoose";
import {
  LOCATION_TYPE_VALUES,
  MOVEMENT_DIRECTION_VALUES,
  MOVEMENT_TYPE_VALUES,
} from "../../../constants/stockMovement.js";

const stockMovementSchema = new mongoose.Schema(
  {
    movementType: {
      type: String,
      required: true,
      enum: MOVEMENT_TYPE_VALUES,
    },
    direction: {
      type: String,
      required: true,
      enum: MOVEMENT_DIRECTION_VALUES,
    },
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
    locationType: {
      type: String,
      required: true,
      enum: LOCATION_TYPE_VALUES,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    counterpartyLocationType: {
      type: String,
      enum: LOCATION_TYPE_VALUES,
    },
    counterpartyLocationId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

stockMovementSchema.index({ locationType: 1, locationId: 1, createdAt: -1 });
stockMovementSchema.index({ drugId: 1, batchId: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1, createdAt: -1 });
stockMovementSchema.index({ performedBy: 1, createdAt: -1 });

stockMovementSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.drugId = String(ret.drugId);
    ret.batchId = String(ret.batchId);
    ret.locationId = String(ret.locationId);
    ret.performedBy = String(ret.performedBy);

    if (ret.counterpartyLocationId) {
      ret.counterpartyLocationId = String(ret.counterpartyLocationId);
    }

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
