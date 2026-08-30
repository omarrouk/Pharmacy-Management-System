import { StockMovement } from "../models/stockMovement.model.js";

export const createStockMovement = async (data, session) => {
  const [movement] = await StockMovement.create([data], { session });
  return movement;
};

export const findStockMovementById = (id) => StockMovement.findById(id);

export const listStockMovements = ({
  filter = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1 },
} = {}) => StockMovement.find(filter).sort(sort).skip(skip).limit(limit);

export const countStockMovements = (filter = {}) =>
  StockMovement.countDocuments(filter);
