import { asyncHandler } from "../../../utils/asyncHandler.js";
import { success } from "../../../utils/response.js";
import * as categoryService from "../services/category.service.js";

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return success(res, "Category created.", category, 201);
});

export const listCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.listCategories(req.validatedQuery);
  return success(res, "Categories retrieved.", result);
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return success(res, "Category retrieved.", category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return success(res, "Category updated.", category);
});

export const deactivateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.deactivateCategory(req.params.id);
  return success(res, "Category deactivated.", category);
});
