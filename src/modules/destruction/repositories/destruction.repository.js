import { Destruction } from "../models/destruction.model.js";

export const createDestruction = (data, session) => {
  if (session) {
    return Destruction.create([data], { session }).then(([doc]) => doc);
  }

  return Destruction.create(data);
};

export const findDestructionById = (id) => Destruction.findById(id);

export const listDestructions = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  Destruction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countDestructions = (filter = {}) => Destruction.countDocuments(filter);

export const countDestructionsWithPrefix = (prefix) =>
  Destruction.countDocuments({
    destructionNumber: { $regex: `^${prefix}` },
  });
