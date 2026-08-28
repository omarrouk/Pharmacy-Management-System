import mongoose from "mongoose";

const pharmacySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    primaryWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

pharmacySchema.index({ isActive: 1 });
pharmacySchema.index({ primaryWarehouseId: 1 });

pharmacySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.primaryWarehouseId = String(ret.primaryWarehouseId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
