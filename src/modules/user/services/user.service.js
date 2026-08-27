import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import { hashPassword } from "../../../utils/password.js";
import { canAccessPharmacy, canAccessWarehouse } from "../../../utils/scope.js";
import * as refreshTokenRepository from "../../auth/repositories/refreshToken.repository.js";
import * as userRepository from "../repositories/user.repository.js";

const PHARMACY_ROLES = [
  ROLES.PHARMACY_MANAGER,
  ROLES.PHARMACIST,
  ROLES.PHARMACY_EMPLOYEE,
];

const WAREHOUSE_ROLES = [ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_EMPLOYEE];

const toPublicUser = (user) => user.toJSON();

const assertLocationScope = (role, pharmacyIds, warehouseIds) => {
  if (role === ROLES.SYSTEM_ADMIN) {
    return;
  }

  if (role === ROLES.PHARMACY_ADMIN) {
    if (pharmacyIds.length === 0 && warehouseIds.length === 0) {
      throw new AppError(
        "Pharmacy Admin must be linked to at least one pharmacy or warehouse.",
        400,
        "INVALID_SCOPE",
      );
    }
    return;
  }

  if (PHARMACY_ROLES.includes(role) && pharmacyIds.length === 0) {
    throw new AppError(
      "This role must be linked to at least one pharmacy.",
      400,
      "INVALID_SCOPE",
    );
  }

  if (WAREHOUSE_ROLES.includes(role) && warehouseIds.length === 0) {
    throw new AppError(
      "This role must be linked to at least one warehouse.",
      400,
      "INVALID_SCOPE",
    );
  }
};

const assertActorCanAssignLocations = (actor, pharmacyIds, warehouseIds) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return;
  }

  for (const pharmacyId of pharmacyIds) {
    if (!canAccessPharmacy(actor, pharmacyId)) {
      throw new AppError(
        "You cannot assign a pharmacy outside your scope.",
        403,
        "FORBIDDEN",
      );
    }
  }

  for (const warehouseId of warehouseIds) {
    if (!canAccessWarehouse(actor, warehouseId)) {
      throw new AppError(
        "You cannot assign a warehouse outside your scope.",
        403,
        "FORBIDDEN",
      );
    }
  }
};

const assertCanManageTarget = (actor, target) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return;
  }

  if (target.role === ROLES.SYSTEM_ADMIN) {
    throw new AppError(
      "You cannot manage a system admin.",
      403,
      "FORBIDDEN",
    );
  }

  const sharesPharmacy = (target.pharmacyIds ?? []).some((id) =>
    canAccessPharmacy(actor, id),
  );
  const sharesWarehouse = (target.warehouseIds ?? []).some((id) =>
    canAccessWarehouse(actor, id),
  );

  if (!sharesPharmacy && !sharesWarehouse) {
    throw new AppError(
      "You cannot manage a user outside your scope.",
      403,
      "FORBIDDEN",
    );
  }
};

const scopedListFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  return {
    $or: [
      { pharmacyIds: { $in: actor.pharmacyIds } },
      { warehouseIds: { $in: actor.warehouseIds } },
    ],
  };
};

export const createUser = async (actor, payload) => {
  if (
    actor.role !== ROLES.SYSTEM_ADMIN &&
    payload.role === ROLES.SYSTEM_ADMIN
  ) {
    throw new AppError("You cannot create a system admin.", 403, "FORBIDDEN");
  }

  const pharmacyIds = payload.pharmacyIds ?? [];
  const warehouseIds = payload.warehouseIds ?? [];

  assertLocationScope(payload.role, pharmacyIds, warehouseIds);
  assertActorCanAssignLocations(actor, pharmacyIds, warehouseIds);

  const existing = await userRepository.findUserByEmail(payload.email);

  if (existing) {
    throw new AppError("Email is already in use.", 409, "EMAIL_IN_USE");
  }

  const user = await userRepository.createUser({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
    pharmacyIds,
    warehouseIds,
  });

  return toPublicUser(user);
};

export const listUsers = async (actor, { page, limit }) => {
  const filter = scopedListFilter(actor);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    userRepository.listUsers({ filter, skip, limit }),
    userRepository.countUsers(filter),
  ]);

  return {
    items: items.map(toPublicUser),
    page,
    limit,
    total,
  };
};

export const getUserById = async (actor, id) => {
  const user = await userRepository.findUserById(id);

  if (!user) {
    throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  }

  assertCanManageTarget(actor, user);
  return toPublicUser(user);
};

export const updateUser = async (actor, id, payload) => {
  const current = await userRepository.findUserById(id);

  if (!current) {
    throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  }

  assertCanManageTarget(actor, current);

  if (
    actor.role !== ROLES.SYSTEM_ADMIN &&
    payload.role === ROLES.SYSTEM_ADMIN
  ) {
    throw new AppError("You cannot assign the system admin role.", 403, "FORBIDDEN");
  }

  const nextRole = payload.role ?? current.role;
  const pharmacyIds = payload.pharmacyIds ?? current.pharmacyIds.map(String);
  const warehouseIds = payload.warehouseIds ?? current.warehouseIds.map(String);

  assertLocationScope(nextRole, pharmacyIds, warehouseIds);
  assertActorCanAssignLocations(actor, pharmacyIds, warehouseIds);

  if (payload.email) {
    const existing = await userRepository.findUserByEmail(payload.email);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError("Email is already in use.", 409, "EMAIL_IN_USE");
    }
  }

  const data = { ...payload };

  if (payload.password) {
    data.passwordHash = await hashPassword(payload.password);
    delete data.password;
  }

  if (payload.email) {
    data.email = payload.email.toLowerCase();
  }

  const updated = await userRepository.updateUserById(id, data);
  return toPublicUser(updated);
};

export const deactivateUser = async (actor, id) => {
  if (String(actor._id) === String(id)) {
    throw new AppError("You cannot deactivate your own account.", 400, "INVALID_ACTION");
  }

  const user = await userRepository.findUserById(id);

  if (!user) {
    throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  }

  assertCanManageTarget(actor, user);

  if (user.role === ROLES.SYSTEM_ADMIN) {
    const adminCount = await userRepository.countAdmins();

    if (adminCount <= 1) {
      throw new AppError(
        "The last system admin cannot be deactivated.",
        400,
        "LAST_ADMIN",
      );
    }
  }

  const updated = await userRepository.updateUserById(id, { isActive: false });
  await refreshTokenRepository.deleteAllUserRefreshTokens(id);
  return toPublicUser(updated);
};
