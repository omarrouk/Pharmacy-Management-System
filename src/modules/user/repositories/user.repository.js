import { ROLES } from "../../../constants/roles.js";
import { User } from "../models/user.model.js";

export const findUserByEmail = (email, { includePassword = false } = {}) => {
  const query = User.findOne({ email: email.toLowerCase() });
  return includePassword ? query.select("+passwordHash") : query;
};

export const findUserById = (id, { includePassword = false } = {}) => {
  const query = User.findById(id);
  return includePassword ? query.select("+passwordHash") : query;
};

export const createUser = (data) => User.create(data);

export const listUsers = ({ filter = {}, skip = 0, limit = 20 } = {}) =>
  User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countUsers = (filter = {}) => User.countDocuments(filter);

export const updateUserById = (id, data) =>
  User.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });

export const countAdmins = () =>
  User.countDocuments({ role: ROLES.SYSTEM_ADMIN, isActive: true });
