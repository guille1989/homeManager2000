import type { Response } from "express";
import * as savingsGoalService from "../services/savingsGoal.service";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuthUser, requireHouseholdId } from "../utils/authContext";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const goals = await savingsGoalService.listSavingsGoals(householdId, user.id, req.query as never);
  res.json(goals);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const goal = await savingsGoalService.createSavingsGoal(householdId, user.id, req.body);
  res.status(201).json(goal);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const goal = await savingsGoalService.updateSavingsGoal(householdId, user.id, req.params.id, req.body);
  res.json(goal);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  await savingsGoalService.deleteSavingsGoal(householdId, user.id, req.params.id);
  res.status(204).send();
});

export const contribute = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const result = await savingsGoalService.addContribution(householdId, user.id, req.params.id, req.body);
  res.status(201).json(result);
});
