import { SupplyRequest } from "../models/supplyRequest.model.js";

export const createSupplyRequest = (data) => SupplyRequest.create(data);

export const findSupplyRequestById = (id) => SupplyRequest.findById(id);

export const listSupplyRequests = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => SupplyRequest.find(filter).sort(sort).skip(skip).limit(limit);

export const countSupplyRequests = (filter = {}) =>
  SupplyRequest.countDocuments(filter);

export const updateSupplyRequestById = (id, data) =>
  SupplyRequest.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
