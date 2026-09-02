import mongoose from "mongoose";

const supplierReturnItemSchema = new mongoose.Schema(
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

const supplierReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [supplierReturnItemSchema],
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

supplierReturnSchema.index({ warehouseId: 1, createdAt: -1 });
supplierReturnSchema.index({ supplierId: 1, createdAt: -1 });

supplierReturnSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.warehouseId = String(ret.warehouseId);
    ret.supplierId = String(ret.supplierId);
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

export const SupplierReturn = mongoose.model("SupplierReturn", supplierReturnSchema);
