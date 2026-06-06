import { Types } from "mongoose";
import { Category } from "../models/Category.model";
import { Transaction } from "../models/Transaction.model";
import type {
  CreateTransactionInput,
  TransactionQuery,
  UpdateTransactionInput
} from "../schemas/transaction.schema";
import { ApiError } from "../utils/ApiError";
import { normalizeVisibility, ownershipFields, visibilityFilter } from "../utils/financeAccess";

const assertCategoryBelongsToHousehold = async (householdId: string, categoryId: string) => {
  const category = await Category.exists({ _id: categoryId, householdId });

  if (!category) {
    throw new ApiError(400, "Category does not belong to this household");
  }
};

const buildTransactionFilter = (householdId: string, userId: string, query: TransactionQuery) => {
  const visibility = normalizeVisibility(query.visibility);
  const filter: Record<string, unknown> = visibilityFilter(
    householdId,
    userId,
    visibility
  );

  if (visibility === "shared") {
    filter.type = "expense";
  } else if (query.type) {
    filter.type = query.type;
  }
  if (query.categoryId) filter.categoryId = new Types.ObjectId(query.categoryId);
  if (query.paidBy) filter.paidBy = query.paidBy;

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) (filter.date as Record<string, Date>).$gte = new Date(query.startDate);
    if (query.endDate) (filter.date as Record<string, Date>).$lte = new Date(query.endDate);
  }

  return filter;
};

export const listTransactions = async (householdId: string, userId: string, query: TransactionQuery) => {
  const filter = buildTransactionFilter(householdId, userId, query);
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const [items, total, totalsByType] = await Promise.all([
    Transaction.find(filter)
      .populate("categoryId", "name color type")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
    Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
      { $match: filter },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ])
  ]);

  const income = totalsByType.find((item) => item._id === "income")?.total ?? 0;
  const expense = totalsByType.find((item) => item._id === "expense")?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    totals: {
      count: total,
      income,
      expense,
      balance: income - expense
    }
  };
};

export const getTransaction = async (householdId: string, userId: string, id: string) => {
  const transaction = await Transaction.findOne({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  }).populate(
    "categoryId",
    "name color type"
  );

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return transaction;
};

export const createTransaction = async (
  householdId: string,
  userId: string,
  input: CreateTransactionInput
) => {
  await assertCategoryBelongsToHousehold(householdId, input.categoryId);
  const visibility = normalizeVisibility(input.visibility);

  if (visibility === "shared" && input.type === "income") {
    throw new ApiError(400, "Shared household transactions must be expenses");
  }

  return Transaction.create({
    ...input,
    type: visibility === "shared" ? "expense" : input.type,
    visibility,
    ...ownershipFields(visibility, userId),
    splitMode: visibility === "private" ? "individual" : "shared",
    splitType: visibility === "shared" ? "equal" : input.splitType,
    splitConfig: visibility === "shared" ? {} : input.splitConfig,
    householdId,
    createdBy: userId
  });
};

export const updateTransaction = async (
  householdId: string,
  userId: string,
  id: string,
  input: UpdateTransactionInput
) => {
  if (input.categoryId) {
    await assertCategoryBelongsToHousehold(householdId, input.categoryId);
  }

  const existing = await Transaction.findOne({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!existing) {
    throw new ApiError(404, "Transaction not found");
  }

  const visibility = normalizeVisibility(input.visibility ?? existing.visibility);
  const next = {
    type: input.type ?? existing.type,
    amount: input.amount ?? existing.amount,
    splitMode: visibility === "private" ? "individual" : "shared",
    splitType: visibility === "shared" ? "equal" : input.splitType ?? existing.splitType,
    splitConfig: visibility === "shared" ? {} : input.splitConfig ?? existing.splitConfig
  };

  if (visibility === "shared" && next.type === "income") {
    throw new ApiError(400, "Shared household transactions must be expenses");
  }

  const update =
    visibility === "private"
      ? { ...input, visibility, ownerId: userId, splitMode: next.splitMode }
      : {
          ...input,
          type: "expense",
          visibility,
          splitMode: "shared",
          splitType: "equal",
          splitConfig: {},
          $unset: { ownerId: "" }
        };

  const transaction = await Transaction.findOneAndUpdate({ _id: id, householdId }, update, {
    new: true,
    runValidators: true
  }).populate("categoryId", "name color type");

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return transaction;
};

export const deleteTransaction = async (householdId: string, userId: string, id: string) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found");
  }

  return transaction;
};
