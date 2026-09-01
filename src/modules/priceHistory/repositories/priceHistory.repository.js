import { PriceHistory } from "../models/priceHistory.model.js";

export const createPriceHistory = (data, session) => {
  if (session) {
    return PriceHistory.create([data], { session }).then(([doc]) => doc);
  }

  return PriceHistory.create(data);
};

export const listPriceHistoryByDrug = (drugId, { skip = 0, limit = 20 } = {}) =>
  PriceHistory.find({ drugId }).sort({ effectiveAt: -1 }).skip(skip).limit(limit);

export const countPriceHistoryByDrug = (drugId) =>
  PriceHistory.countDocuments({ drugId });
