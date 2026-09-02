import { PharmacyReturn } from "../models/pharmacyReturn.model.js";

export const createPharmacyReturn = (data, session) => {
  if (session) {
    return PharmacyReturn.create([data], { session }).then(([doc]) => doc);
  }

  return PharmacyReturn.create(data);
};

export const findPharmacyReturnById = (id) => PharmacyReturn.findById(id);

export const updatePharmacyReturnById = (id, data, session) =>
  PharmacyReturn.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
    session,
  });

export const listPharmacyReturns = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  PharmacyReturn.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countPharmacyReturns = (filter = {}) =>
  PharmacyReturn.countDocuments(filter);

export const countPharmacyReturnsWithPrefix = (prefix) =>
  PharmacyReturn.countDocuments({
    returnNumber: { $regex: `^${prefix}` },
  });
