import { Drug } from "../models/drug.model.js";

export const createDrug = (data) => Drug.create(data);

export const findDrugById = (id) => Drug.findById(id);

export const findDrugsByIds = (ids) =>
  ids.length ? Drug.find({ _id: { $in: ids } }).select("name") : [];

export const findDrugByBarcode = (barcode) => Drug.findOne({ barcode });

export const listDrugs = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Drug.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countDrugs = (filter = {}) => Drug.countDocuments(filter);

export const updateDrugById = (id, data) =>
  Drug.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });

export const findDrugsByActiveIngredient = (activeIngredientId) =>
  Drug.find({ activeIngredientIds: activeIngredientId, isActive: true }).sort({
    name: 1,
  });
