import { AppError } from "../../../utils/appError.js";
import * as categoryRepository from "../repositories/category.repository.js";

const toPublic = (doc) => doc.toJSON();

const buildListFilter = ({ search }) => {
  if (!search) return {};

  return { name: { $regex: search, $options: "i" } };
};

export const createCategory = async (payload) => {
  const existing = await categoryRepository.findCategoryByName(payload.name);

  if (existing) {
    throw new AppError("Category name is already in use.", 409, "NAME_IN_USE");
  }

  const category = await categoryRepository.createCategory({
    name: payload.name,
    description: payload.description ?? "",
  });

  return toPublic(category);
};

export const listCategories = async ({ page, limit, search }) => {
  const filter = buildListFilter({ search });
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    categoryRepository.listCategories({ filter, skip, limit }),
    categoryRepository.countCategories(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getCategoryById = async (id) => {
  const category = await categoryRepository.findCategoryById(id);

  if (!category) {
    throw new AppError("Category was not found.", 404, "CATEGORY_NOT_FOUND");
  }

  return toPublic(category);
};

export const updateCategory = async (id, payload) => {
  const current = await categoryRepository.findCategoryById(id);

  if (!current) {
    throw new AppError("Category was not found.", 404, "CATEGORY_NOT_FOUND");
  }

  if (payload.name) {
    const existing = await categoryRepository.findCategoryByName(payload.name);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError("Category name is already in use.", 409, "NAME_IN_USE");
    }
  }

  const updated = await categoryRepository.updateCategoryById(id, payload);
  return toPublic(updated);
};

export const deactivateCategory = async (id) => {
  const category = await categoryRepository.findCategoryById(id);

  if (!category) {
    throw new AppError("Category was not found.", 404, "CATEGORY_NOT_FOUND");
  }

  if (!category.isActive) {
    return toPublic(category);
  }

  const updated = await categoryRepository.updateCategoryById(id, {
    isActive: false,
  });

  return toPublic(updated);
};
