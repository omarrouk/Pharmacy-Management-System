import { Category } from "../models/category.model.js";

export const createCategory = (data) => Category.create(data);

export const findCategoryById = (id) => Category.findById(id);

export const findCategoryByName = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Category.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } });
};

export const listCategories = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit);

export const countCategories = (filter = {}) => Category.countDocuments(filter);

export const updateCategoryById = (id, data) =>
  Category.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
