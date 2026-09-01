import { Batch } from "../models/batch.model.js";

export const createBatch = (data, session) => {
  if (session) {
    return Batch.create([data], { session }).then(([doc]) => doc);
  }

  return Batch.create(data);
};

export const findBatchById = (id) => Batch.findById(id);

export const findBatchesByIds = (ids) =>
  ids.length
    ? Batch.find({ _id: { $in: ids } }).select("batchNumber expiryDate")
    : [];

export const findBatchByDrugAndNumber = (drugId, batchNumber) =>
  Batch.findOne({
    drugId,
    batchNumber: batchNumber.toUpperCase(),
  });

export const listBatches = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { expiryDate: 1 },
} = {}) => Batch.find(filter).sort(sort).skip(skip).limit(limit);

export const countBatches = (filter = {}) => Batch.countDocuments(filter);

export const updateBatchById = (id, data) =>
  Batch.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });

export const listBatchesByDrugFefo = (drugId) =>
  Batch.find({ drugId, isActive: true }).sort({ expiryDate: 1 });
