import type { Response } from "express";
import * as transactionService from "../services/transaction.service";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuthUser, requireHouseholdId } from "../utils/authContext";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const transactions = await transactionService.listTransactions(householdId, user.id, req.query as never);
  res.json(transactions);
});

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const transaction = await transactionService.getTransaction(householdId, user.id, req.params.id);
  res.json(transaction);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const transaction = await transactionService.createTransaction(householdId, user.id, req.body);
  res.status(201).json(transaction);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  const transaction = await transactionService.updateTransaction(householdId, user.id, req.params.id, req.body);
  res.json(transaction);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const householdId = requireHouseholdId(req);
  const user = requireAuthUser(req);
  await transactionService.deleteTransaction(householdId, user.id, req.params.id);
  res.status(204).send();
});
