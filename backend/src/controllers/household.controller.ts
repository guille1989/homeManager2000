import type { Response } from "express";
import * as householdService from "../services/household.service";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuthUser, requireHouseholdId } from "../utils/authContext";

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireAuthUser(req);
  const household = await householdService.createHousehold(user.id, user.name, req.body);
  res.status(201).json(household);
});

export const current = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const household = await householdService.getCurrentHousehold(householdId);
  res.json(household);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const household = await householdService.updateHousehold(householdId, req.params.id, req.body);
  res.json(household);
});

export const invite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const invite = await householdService.createInvite(householdId, req.params.id);
  res.status(201).json(invite);
});

export const join = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireAuthUser(req);
  const household = await householdService.joinHousehold(user.id, user.name, req.body);
  res.status(201).json(household);
});

export const clearData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const result = await householdService.clearHouseholdData(householdId, req.params.id);
  res.json(result);
});
