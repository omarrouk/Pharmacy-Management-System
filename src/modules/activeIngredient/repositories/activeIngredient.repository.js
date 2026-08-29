import { ActiveIngredient } from "../models/activeIngredient.model.js";

export const createActiveIngredient = (data) => ActiveIngredient.create(data);

export const findActiveIngredientById = (id) => ActiveIngredient.findById(id);

export const findActiveIngredientByName = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return ActiveIngredient.findOne({
    name: { $regex: `^${escaped}$`, $options: "i" },
  });
};

export const listActiveIngredients = ({
  filter = {},
  skip = 0,
  limit = 20,
} = {}) =>
  ActiveIngredient.find(filter).sort({ name: 1 }).skip(skip).limit(limit);

export const countActiveIngredients = (filter = {}) =>
  ActiveIngredient.countDocuments(filter);

export const updateActiveIngredientById = (id, data) =>
  ActiveIngredient.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });

export const findActiveIngredientsByIds = (ids) =>
  ActiveIngredient.find({ _id: { $in: ids }, isActive: true });
