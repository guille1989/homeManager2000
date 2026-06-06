import type { Response } from "express";
import * as budgetService from "../services/budget.service";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuthUser, requireHouseholdId } from "../utils/authContext";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const budgets = await budgetService.listBudgets(householdId, user.id, req.query as never);
  res.json(budgets);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const budget = await budgetService.createBudget(householdId, user.id, req.body);
  res.status(201).json(budget);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const budget = await budgetService.updateBudget(householdId, user.id, req.params.id, req.body);
  res.json(budget);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  await budgetService.deleteBudget(householdId, user.id, req.params.id);
  res.status(204).send();
});
