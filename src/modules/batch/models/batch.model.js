import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    drugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drug",
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      trim: true,
      default: "",
    },
    receiptReference: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

batchSchema.index({ drugId: 1, batchNumber: 1 }, { unique: true });
batchSchema.index({ drugId: 1, expiryDate: 1 });
batchSchema.index({ expiryDate: 1 });
batchSchema.index({ isActive: 1 });

batchSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.drugId = String(ret.drugId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Batch = mongoose.model("Batch", batchSchema);
