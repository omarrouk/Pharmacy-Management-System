import mongoose from "mongoose";

const destructionItemSchema = new mongoose.Schema(
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
  },
  { _id: false },
);

const destructionSchema = new mongoose.Schema(
  {
    destructionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    locationType: {
      type: String,
      required: true,
      enum: ["pharmacy", "warehouse"],
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [destructionItemSchema],
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

destructionSchema.index({ locationType: 1, locationId: 1, createdAt: -1 });

destructionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.locationId = String(ret.locationId);
    ret.createdBy = String(ret.createdBy);
    ret.items = ret.items.map((item) => ({
      drugId: String(item.drugId),
      batchId: String(item.batchId),
      quantity: item.quantity,
    }));
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Destruction = mongoose.model("Destruction", destructionSchema);
