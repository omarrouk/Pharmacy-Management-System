import mongoose from "mongoose";
import { LOCATION_TYPE_VALUES } from "../../../constants/stockMovement.js";

const inventorySchema = new mongoose.Schema(
  {
    locationType: {
      type: String,
      required: true,
      enum: LOCATION_TYPE_VALUES,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

inventorySchema.index(
  { locationType: 1, locationId: 1, batchId: 1 },
  { unique: true },
);
inventorySchema.index({ locationType: 1, locationId: 1, drugId: 1 });
inventorySchema.index({ drugId: 1, batchId: 1 });

inventorySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.locationId = String(ret.locationId);
    ret.drugId = String(ret.drugId);
    ret.batchId = String(ret.batchId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Inventory = mongoose.model("Inventory", inventorySchema);
