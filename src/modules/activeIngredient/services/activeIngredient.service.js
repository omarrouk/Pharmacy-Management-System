import { AppError } from "../../../utils/appError.js";
import * as activeIngredientRepository from "../repositories/activeIngredient.repository.js";

const toPublic = (doc) => doc.toJSON();

const buildListFilter = ({ search }) => {
  if (!search) return {};

  return { name: { $regex: search, $options: "i" } };
};

export const createActiveIngredient = async (payload) => {
  const existing = await activeIngredientRepository.findActiveIngredientByName(
    payload.name,
  );

  if (existing) {
    throw new AppError(
      "Active ingredient name is already in use.",
      409,
      "NAME_IN_USE",
    );
  }

  const ingredient = await activeIngredientRepository.createActiveIngredient({
    name: payload.name,
  });

  return toPublic(ingredient);
};

export const listActiveIngredients = async ({ page, limit, search }) => {
  const filter = buildListFilter({ search });
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    activeIngredientRepository.listActiveIngredients({ filter, skip, limit }),
    activeIngredientRepository.countActiveIngredients(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getActiveIngredientById = async (id) => {
  const ingredient = await activeIngredientRepository.findActiveIngredientById(
    id,
  );

  if (!ingredient) {
    throw new AppError(
      "Active ingredient was not found.",
      404,
      "ACTIVE_INGREDIENT_NOT_FOUND",
    );
  }

  return toPublic(ingredient);
};

export const updateActiveIngredient = async (id, payload) => {
  const current = await activeIngredientRepository.findActiveIngredientById(id);

  if (!current) {
    throw new AppError(
      "Active ingredient was not found.",
      404,
      "ACTIVE_INGREDIENT_NOT_FOUND",
    );
  }

  if (payload.name) {
    const existing = await activeIngredientRepository.findActiveIngredientByName(
      payload.name,
    );

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError(
        "Active ingredient name is already in use.",
        409,
        "NAME_IN_USE",
      );
    }
  }

  const updated = await activeIngredientRepository.updateActiveIngredientById(
    id,
    payload,
  );
  return toPublic(updated);
};

export const deactivateActiveIngredient = async (id) => {
  const ingredient = await activeIngredientRepository.findActiveIngredientById(
    id,
  );

  if (!ingredient) {
    throw new AppError(
      "Active ingredient was not found.",
      404,
      "ACTIVE_INGREDIENT_NOT_FOUND",
    );
  }

  if (!ingredient.isActive) {
    return toPublic(ingredient);
  }

  const updated = await activeIngredientRepository.updateActiveIngredientById(
    id,
    { isActive: false },
  );

  return toPublic(updated);
};
