import mongoose from "mongoose";

const drugSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    activeIngredientIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "ActiveIngredient",
      required: true,
      validate: {
        validator: (ids) => Array.isArray(ids) && ids.length > 0,
        message: "At least one active ingredient is required.",
      },
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manufacturer",
      required: true,
    },
    dosageForm: {
      type: String,
      required: true,
      trim: true,
    },
    concentration: {
      type: String,
      required: true,
      trim: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumStockThreshold: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

drugSchema.index({ name: 1 });
drugSchema.index({ categoryId: 1 });
drugSchema.index({ activeIngredientIds: 1 });
drugSchema.index({ isActive: 1 });

drugSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.categoryId = String(ret.categoryId);
    ret.manufacturerId = String(ret.manufacturerId);
    ret.activeIngredientIds = ret.activeIngredientIds.map(String);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Drug = mongoose.model("Drug", drugSchema);
