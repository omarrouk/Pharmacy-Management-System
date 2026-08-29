import { Manufacturer } from "../models/manufacturer.model.js";

export const createManufacturer = (data) => Manufacturer.create(data);

export const findManufacturerById = (id) => Manufacturer.findById(id);

export const findManufacturerByName = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Manufacturer.findOne({
    name: { $regex: `^${escaped}$`, $options: "i" },
  });
};

export const listManufacturers = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Manufacturer.find(filter).sort({ name: 1 }).skip(skip).limit(limit);

export const countManufacturers = (filter = {}) =>
  Manufacturer.countDocuments(filter);

export const updateManufacturerById = (id, data) =>
  Manufacturer.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });

export const findActiveManufacturersByIds = (ids) =>
  Manufacturer.find({ _id: { $in: ids }, isActive: true });
