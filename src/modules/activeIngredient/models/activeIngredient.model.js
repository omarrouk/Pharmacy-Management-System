import mongoose from "mongoose";

const activeIngredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

activeIngredientSchema.index({ isActive: 1 });

activeIngredientSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ActiveIngredient = mongoose.model(
  "ActiveIngredient",
  activeIngredientSchema,
);
