import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    drugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    previousPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    newPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

priceHistorySchema.index({ drugId: 1, effectiveAt: -1 });

priceHistorySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.drugId = String(ret.drugId);
    ret.changedBy = String(ret.changedBy);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);
