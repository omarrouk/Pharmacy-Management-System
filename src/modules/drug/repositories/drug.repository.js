import { Drug } from "../models/drug.model.js";

export const createDrug = (data) => Drug.create(data);

export const findDrugById = (id, session) => {
  const query = Drug.findById(id);
  return session ? query.session(session) : query;
};

export const findDrugsByIds = (ids) =>
  ids.length ? Drug.find({ _id: { $in: ids } }).select("name") : [];

export const findDrugByBarcode = (barcode) => Drug.findOne({ barcode });

export const listDrugs = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Drug.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countDrugs = (filter = {}) => Drug.countDocuments(filter);

export const updateDrugById = (id, data, session) =>
  Drug.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
    session,
  });

export const findDrugsByActiveIngredient = (
  activeIngredientId,
  { skip = 0, limit = 20 } = {},
) =>
  Drug.find({ activeIngredientIds: activeIngredientId, isActive: true })
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

export const countDrugsByActiveIngredient = (activeIngredientId) =>
  Drug.countDocuments({ activeIngredientIds: activeIngredientId, isActive: true });
