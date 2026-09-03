import mongoose from "mongoose";
import { DISCOUNT_TYPE_VALUES } from "../../../constants/sales.js";

const salesInvoiceItemSchema = new mongoose.Schema(
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: [...DISCOUNT_TYPE_VALUES, null],
      default: null,
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    nationalId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const salesInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    customer: {
      type: customerSchema,
      default: () => ({}),
    },
    items: {
      type: [salesInvoiceItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

salesInvoiceSchema.index({ pharmacyId: 1, createdAt: -1 });

salesInvoiceSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.pharmacyId = String(ret.pharmacyId);
    ret.paymentMethodId = String(ret.paymentMethodId);
    ret.createdBy = String(ret.createdBy);

    ret.items = ret.items.map((item) => ({
      drugId: String(item.drugId),
      batchId: String(item.batchId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountType: item.discountType,
      discountValue: item.discountValue,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal,
    }));

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const SalesInvoice = mongoose.model("SalesInvoice", salesInvoiceSchema);
