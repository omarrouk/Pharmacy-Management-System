import { Pharmacy } from "../models/pharmacy.model.js";

export const createPharmacy = (data) => Pharmacy.create(data);

export const findPharmacyById = (id) => Pharmacy.findById(id);

export const findPharmaciesByIds = (ids) =>
  ids.length ? Pharmacy.find({ _id: { $in: ids } }).select("name code") : [];

export const findPharmacyByCode = (code) =>
  Pharmacy.findOne({ code: code.toUpperCase() });

export const listPharmacies = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Pharmacy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countPharmacies = (filter = {}) => Pharmacy.countDocuments(filter);

export const updatePharmacyById = (id, data) =>
  Pharmacy.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
