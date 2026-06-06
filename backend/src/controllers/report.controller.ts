import type { Response } from "express";
import * as reportService from "../services/report.service";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuthUser, requireHouseholdId } from "../utils/authContext";

export const summary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const result = await reportService.getSummary(householdId, user.id, req.query as never);
  res.json(result);
});

export const categoryBreakdown = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const result = await reportService.getCategoryBreakdown(householdId, user.id, req.query as never);
  res.json(result);
});

export const incomeVsExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const result = await reportService.getIncomeVsExpense(householdId, user.id, req.query as never);
  res.json(result);
});

export const partnerBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const result = await reportService.getPartnerBalance(householdId, req.query as never);
  res.json(result);
});

export const monthComparison = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const result = await reportService.getMonthComparison(
    householdId,
    user.id,
    (req.query.visibility as "private" | "shared" | undefined) ?? "shared"
  );
  res.json(result);
});

export const csv = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const result = await reportService.exportTransactionsCsv(
    householdId,
    user.id,
    (req.query.visibility as "private" | "shared" | undefined) ?? "shared"
  );
  res.header("Content-Type", "text/csv");
  res.attachment("transactions.csv");
  res.send(result);
});
