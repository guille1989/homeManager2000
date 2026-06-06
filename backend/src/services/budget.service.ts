import { Types } from "mongoose";
import { Budget } from "../models/Budget.model";
import { Category } from "../models/Category.model";
import { Transaction } from "../models/Transaction.model";
import type { BudgetQuery, CreateBudgetInput, UpdateBudgetInput } from "../schemas/budget.schema";
import { getMonthYear } from "../utils/dateRange";
import { ApiError } from "../utils/ApiError";
import { normalizeVisibility, ownershipFields, visibilityFilter } from "../utils/financeAccess";

const assertCategoryBelongsToHousehold = async (householdId: string, categoryId: string) => {
  const category = await Category.exists({ _id: categoryId, householdId });

  if (!category) {
    throw new ApiError(400, "Category does not belong to this household");
  }
};

const spentForBudget = async (
  householdId: string,
  userId: string,
  categoryId: string,
  month: number,
  year: number,
  visibility: "private" | "shared"
) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const result = await Transaction.aggregate<{ total: number }>([
    {
      $match: {
        householdId: new Types.ObjectId(householdId),
        visibility,
        ...(visibility === "private" ? { ownerId: new Types.ObjectId(userId) } : {}),
        categoryId: new Types.ObjectId(categoryId),
        type: "expense",
        date: { $gte: start, $lte: end }
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return result[0]?.total ?? 0;
};

export const listBudgets = async (householdId: string, userId: string, query: BudgetQuery) => {
  const fallback = getMonthYear();
  const month = query.month ?? fallback.month;
  const year = query.year ?? fallback.year;
  const visibility = normalizeVisibility(query.visibility);
  const budgets = await Budget.find({ ...visibilityFilter(householdId, userId, visibility), month, year })
    .populate<{ categoryId: { _id: Types.ObjectId; name: string; color: string } }>("categoryId", "name color")
    .sort({ year: -1, month: -1 });

  return Promise.all(
    budgets.map(async (budget) => {
      const spent = await spentForBudget(
        householdId,
        userId,
        budget.categoryId._id.toString(),
        budget.month,
        budget.year,
        visibility
      );
      return {
        ...budget.toObject(),
        spent,
        percentage: budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0
      };
    })
  );
};

export const createBudget = async (householdId: string, userId: string, input: CreateBudgetInput) => {
  await assertCategoryBelongsToHousehold(householdId, input.categoryId);
  const visibility = normalizeVisibility(input.visibility);
  return Budget.findOneAndUpdate(
    {
      householdId,
      visibility,
      ...(visibility === "private" ? { ownerId: userId } : { ownerId: { $exists: false } }),
      categoryId: input.categoryId,
      month: input.month,
      year: input.year
    },
    {
      ...input,
      visibility,
      ...ownershipFields(visibility, userId),
      householdId
    },
    { new: true, upsert: true, runValidators: true }
  );
};

export const updateBudget = async (householdId: string, userId: string, id: string, input: UpdateBudgetInput) => {
  if (input.categoryId) {
    await assertCategoryBelongsToHousehold(householdId, input.categoryId);
  }

  const existing = await Budget.findOne({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!existing) {
    throw new ApiError(404, "Budget not found");
  }

  const visibility = normalizeVisibility(input.visibility ?? existing.visibility);
  const update =
    visibility === "private"
      ? { ...input, visibility, ownerId: userId }
      : { ...input, visibility, $unset: { ownerId: "" } };

  const budget = await Budget.findOneAndUpdate({ _id: id, householdId }, update, {
    new: true,
    runValidators: true
  });

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  return budget;
};

export const deleteBudget = async (householdId: string, userId: string, id: string) => {
  const budget = await Budget.findOneAndDelete({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }

  return budget;
};
