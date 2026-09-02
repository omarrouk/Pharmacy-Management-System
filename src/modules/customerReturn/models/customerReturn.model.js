import mongoose from "mongoose";

const customerReturnItemSchema = new mongoose.Schema(
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

const customerReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    salesInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesInvoice",
      required: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
    },
    items: {
      type: [customerReturnItemSchema],
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

customerReturnSchema.index({ salesInvoiceId: 1, createdAt: -1 });
customerReturnSchema.index({ pharmacyId: 1, createdAt: -1 });

customerReturnSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.salesInvoiceId = String(ret.salesInvoiceId);
    ret.pharmacyId = String(ret.pharmacyId);
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

export const CustomerReturn = mongoose.model("CustomerReturn", customerReturnSchema);
