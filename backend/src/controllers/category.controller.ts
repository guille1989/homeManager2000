import type { Response } from "express";
import * as categoryService from "../services/category.service";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireHouseholdId } from "../utils/authContext";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const categories = await categoryService.listCategories(householdId);
  res.json(categories);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const category = await categoryService.createCategory(householdId, req.body);
  res.status(201).json(category);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const category = await categoryService.updateCategory(householdId, req.params.id, req.body);
  res.json(category);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  await categoryService.deleteCategory(householdId, req.params.id);
  res.status(204).send();
});

