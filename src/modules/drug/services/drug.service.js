import { AppError } from "../../../utils/appError.js";
import * as activeIngredientRepository from "../../activeIngredient/repositories/activeIngredient.repository.js";
import * as categoryRepository from "../../category/repositories/category.repository.js";
import * as manufacturerRepository from "../../manufacturer/repositories/manufacturer.repository.js";
import * as drugRepository from "../repositories/drug.repository.js";

const toPublic = (doc) => doc.toJSON();

const assertReferences = async ({
  categoryId,
  manufacturerId,
  activeIngredientIds,
}) => {
  const category = await categoryRepository.findCategoryById(categoryId);

  if (!category || !category.isActive) {
    throw new AppError("Category was not found or is inactive.", 400, "INVALID_CATEGORY");
  }

  const manufacturer = await manufacturerRepository.findManufacturerById(
    manufacturerId,
  );

  if (!manufacturer || !manufacturer.isActive) {
    throw new AppError(
      "Manufacturer was not found or is inactive.",
      400,
      "INVALID_MANUFACTURER",
    );
  }

  const ingredients = await activeIngredientRepository.findActiveIngredientsByIds(
    activeIngredientIds,
  );

  if (ingredients.length !== activeIngredientIds.length) {
    throw new AppError(
      "One or more active ingredients were not found or are inactive.",
      400,
      "INVALID_ACTIVE_INGREDIENT",
    );
  }
};

const buildListFilter = ({ search, categoryId, activeIngredientId }) => {
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (activeIngredientId) {
    filter.activeIngredientIds = activeIngredientId;
  }

  return filter;
};

export const createDrug = async (payload) => {
  await assertReferences(payload);

  const existing = await drugRepository.findDrugByBarcode(payload.barcode);

  if (existing) {
    throw new AppError("Barcode is already in use.", 409, "BARCODE_IN_USE");
  }

  const drug = await drugRepository.createDrug(payload);
  return toPublic(drug);
};

export const listDrugs = async ({
  page,
  limit,
  search,
  categoryId,
  activeIngredientId,
}) => {
  const filter = buildListFilter({ search, categoryId, activeIngredientId });
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    drugRepository.listDrugs({ filter, skip, limit }),
    drugRepository.countDrugs(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getDrugById = async (id) => {
  const drug = await drugRepository.findDrugById(id);

  if (!drug) {
    throw new AppError("Drug was not found.", 404, "DRUG_NOT_FOUND");
  }

  return toPublic(drug);
};

export const updateDrug = async (id, payload) => {
  const current = await drugRepository.findDrugById(id);

  if (!current) {
    throw new AppError("Drug was not found.", 404, "DRUG_NOT_FOUND");
  }

  const nextRefs = {
    categoryId: payload.categoryId ?? String(current.categoryId),
    manufacturerId: payload.manufacturerId ?? String(current.manufacturerId),
    activeIngredientIds:
      payload.activeIngredientIds ??
      current.activeIngredientIds.map(String),
  };

  await assertReferences(nextRefs);

  if (payload.barcode) {
    const existing = await drugRepository.findDrugByBarcode(payload.barcode);

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError("Barcode is already in use.", 409, "BARCODE_IN_USE");
    }
  }

  const updated = await drugRepository.updateDrugById(id, payload);
  return toPublic(updated);
};

export const deactivateDrug = async (id) => {
  const drug = await drugRepository.findDrugById(id);

  if (!drug) {
    throw new AppError("Drug was not found.", 404, "DRUG_NOT_FOUND");
  }

  if (!drug.isActive) {
    return toPublic(drug);
  }

  const updated = await drugRepository.updateDrugById(id, { isActive: false });
  return toPublic(updated);
};

export const listDrugsByActiveIngredient = async (activeIngredientId) => {
  const ingredient = await activeIngredientRepository.findActiveIngredientById(
    activeIngredientId,
  );

  if (!ingredient) {
    throw new AppError(
      "Active ingredient was not found.",
      404,
      "ACTIVE_INGREDIENT_NOT_FOUND",
    );
  }

  const drugs = await drugRepository.findDrugsByActiveIngredient(
    activeIngredientId,
  );

  return drugs.map(toPublic);
};
