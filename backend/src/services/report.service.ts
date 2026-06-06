import { Types } from "mongoose";
import { Category } from "../models/Category.model";
import { Household } from "../models/Household.model";
import { SavingsGoal } from "../models/SavingsGoal.model";
import { Transaction, type ITransaction } from "../models/Transaction.model";
import type { Period } from "../utils/dateRange";
import { getDateRange } from "../utils/dateRange";
import { ApiError } from "../utils/ApiError";
import { normalizeVisibility, visibilityFilter } from "../utils/financeAccess";
import { calculateCompensation, calculateSplitShares } from "../utils/splits";

type ReportQuery = {
  period?: Period;
  date?: string;
  visibility?: "private" | "shared";
};

const rangeMatch = (query: ReportQuery) => {
  const { start, end } = getDateRange(query.period, query.date);
  return { start, end };
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const getHouseholdMemberName = async (householdId: string, userId: string) => {
  const household = await Household.findById(householdId);

  if (!household) {
    throw new ApiError(404, "Household not found");
  }

  const memberName =
    household.members.find((member) => member.userId.toString() === userId)?.name ??
    household.partnerNames[0];

  return { household, memberName };
};

const sharedExpenseImpactForMember = (
  transaction: ITransaction,
  memberName: string,
  partnerNames: string[]
) => {
  if (transaction.type !== "expense") return 0;

  if (transaction.splitMode === "individual") {
    return transaction.paidBy === memberName ? transaction.amount : 0;
  }

  const shares = calculateSplitShares(
    transaction.amount,
    partnerNames,
    transaction.splitType,
    transaction.splitConfig
  );

  return shares.find((share) => share.member === memberName)?.amount ?? 0;
};

const getPersonalSharedExpenseImpacts = async (householdId: string, userId: string, start: Date, end: Date) => {
  const { household, memberName } = await getHouseholdMemberName(householdId, userId);
  const transactions = await Transaction.find({
    householdId,
    visibility: "shared",
    type: "expense",
    date: { $gte: start, $lte: end }
  }).populate("categoryId", "name color");

  return transactions
    .map((transaction) => ({
      transaction,
      amount: sharedExpenseImpactForMember(transaction, memberName, household.partnerNames)
    }))
    .filter((impact) => impact.amount > 0);
};

export const getSummary = async (householdId: string, userId: string, query: ReportQuery) => {
  const { start, end } = rangeMatch(query);
  const visibility = normalizeVisibility(query.visibility);
  const baseMatch = visibilityFilter(householdId, userId, visibility);
  const summaryMatch =
    visibility === "shared" ? { ...baseMatch, type: "expense", date: { $gte: start, $lte: end } } : { ...baseMatch, date: { $gte: start, $lte: end } };

  const totals = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    { $match: summaryMatch },
    { $group: { _id: "$type", total: { $sum: "$amount" } } }
  ]);

  const income = totals.find((item) => item._id === "income")?.total ?? 0;
  let expense = totals.find((item) => item._id === "expense")?.total ?? 0;

  if (visibility === "private") {
    const sharedImpacts = await getPersonalSharedExpenseImpacts(householdId, userId, start, end);
    expense = roundMoney(expense + sharedImpacts.reduce((sum, impact) => sum + impact.amount, 0));
  }

  const goals = await SavingsGoal.find(baseMatch).sort({ targetDate: 1 }).limit(5);

  return {
    period: query.period ?? "month",
    start,
    end,
    income,
    expense,
    balance: income - expense,
    estimatedSavings: Math.max(income - expense, 0),
    goals: goals.map((goal) => ({
      id: goal._id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      percentage: Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100),
      color: goal.color
    }))
  };
};

export const getCategoryBreakdown = async (householdId: string, userId: string, query: ReportQuery) => {
  const { start, end } = rangeMatch(query);
  const visibility = normalizeVisibility(query.visibility);

  if (visibility === "private") {
    const privateBreakdown = await Transaction.aggregate([
      {
        $match: {
          ...visibilityFilter(householdId, userId, visibility),
          type: "expense",
          date: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          name: "$category.name",
          color: "$category.color",
          total: 1
        }
      }
    ]);

    const grouped = new Map<string, { categoryId: Types.ObjectId | string; name: string; color: string; total: number }>();

    privateBreakdown.forEach((item) => {
      grouped.set(item.categoryId.toString(), { ...item, total: item.total });
    });

    const sharedImpacts = await getPersonalSharedExpenseImpacts(householdId, userId, start, end);
    sharedImpacts.forEach(({ transaction, amount }) => {
      const category = transaction.categoryId as unknown as { _id: Types.ObjectId; name?: string; color?: string };
      const key = category._id.toString();
      const current = grouped.get(key) ?? {
        categoryId: category._id,
        name: category.name ?? "Sin categoria",
        color: category.color ?? "#448481",
        total: 0
      };
      current.total = roundMoney(current.total + amount);
      grouped.set(key, current);
    });

    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }

  return Transaction.aggregate([
    {
      $match: {
        ...visibilityFilter(householdId, userId, visibility),
        type: "expense",
        date: { $gte: start, $lte: end }
      }
    },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        name: "$category.name",
        color: "$category.color",
        total: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
};

const bucketKey = (date: Date, period: Period) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return period === "year" ? `${year}-${month}` : `${year}-${month}-${day}`;
};

export const getIncomeVsExpense = async (householdId: string, userId: string, query: ReportQuery) => {
  const period = query.period ?? "month";
  const { start, end } = rangeMatch(query);
  const visibility = normalizeVisibility(query.visibility);
  const transactions = await Transaction.find({
    ...visibilityFilter(householdId, userId, visibility),
    ...(visibility === "shared" ? { type: "expense" } : {}),
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  const grouped = new Map<string, { label: string; income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const label = bucketKey(transaction.date, period);
    const current = grouped.get(label) ?? { label, income: 0, expense: 0 };
    current[transaction.type] += transaction.amount;
    grouped.set(label, current);
  });

  if (visibility === "private") {
    const sharedImpacts = await getPersonalSharedExpenseImpacts(householdId, userId, start, end);
    sharedImpacts.forEach(({ transaction, amount }) => {
      const label = bucketKey(transaction.date, period);
      const current = grouped.get(label) ?? { label, income: 0, expense: 0 };
      current.expense = roundMoney(current.expense + amount);
      grouped.set(label, current);
    });
  }

  return [...grouped.values()];
};

export const getMonthComparison = async (householdId: string, userId: string, visibility = "shared" as "private" | "shared") => {
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const aggregateRange = async (start: Date, end: Date) => {
    const totals = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
      {
        $match: {
          ...visibilityFilter(householdId, userId, visibility),
          ...(visibility === "shared" ? { type: "expense" } : {}),
          date: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]);

    const income = totals.find((item) => item._id === "income")?.total ?? 0;
    let expense = totals.find((item) => item._id === "expense")?.total ?? 0;
    if (visibility === "private") {
      const sharedImpacts = await getPersonalSharedExpenseImpacts(householdId, userId, start, end);
      expense = roundMoney(expense + sharedImpacts.reduce((sum, impact) => sum + impact.amount, 0));
    }
    return { income, expense, balance: income - expense };
  };

  return {
    current: await aggregateRange(currentStart, currentEnd),
    previous: await aggregateRange(previousStart, previousEnd)
  };
};

export const getPartnerBalance = async (householdId: string, query: ReportQuery) => {
  const household = await Household.findById(householdId);

  if (!household) {
    throw new ApiError(404, "Household not found");
  }

  const partnerNames = household.partnerNames;
  const { start, end } = rangeMatch(query);
  const transactions = await Transaction.find({
    householdId,
    visibility: "shared",
    type: "expense",
    date: { $gte: start, $lte: end }
  });

  const contributions = Object.fromEntries(partnerNames.map((name) => [name, 0]));
  const paidExpenses = Object.fromEntries(partnerNames.map((name) => [name, 0]));
  const sharedExpenseNet = Object.fromEntries(partnerNames.map((name) => [name, 0]));
  const totalSharedExpenses = transactions
    .filter((transaction) => transaction.type === "expense" && transaction.splitMode === "shared")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  transactions.forEach((transaction) => {
    if (!partnerNames.includes(transaction.paidBy)) {
      contributions[transaction.paidBy] ??= 0;
      paidExpenses[transaction.paidBy] ??= 0;
      sharedExpenseNet[transaction.paidBy] ??= 0;
    }

    paidExpenses[transaction.paidBy] += transaction.amount;

    if (transaction.splitMode === "shared") {
      const compensation = calculateCompensation(
        transaction.amount,
        transaction.paidBy,
        partnerNames,
        transaction.splitType,
        transaction.splitConfig
      );
      Object.entries(compensation.net).forEach(([name, amount]) => {
        sharedExpenseNet[name] += amount;
      });
    }
  });

  const contributionPercentages = Object.fromEntries(
    Object.entries(paidExpenses).map(([name, amount]) => [
      name,
      totalSharedExpenses > 0 ? Math.round((amount / totalSharedExpenses) * 10000) / 100 : 0
    ])
  );

  const amounts = Object.values(paidExpenses);
  const contributionDifference =
    amounts.length > 1 ? Math.round((Math.max(...amounts) - Math.min(...amounts)) * 100) / 100 : 0;

  const [first, second] = partnerNames;
  const firstNet = sharedExpenseNet[first] ?? 0;
  const secondNet = sharedExpenseNet[second] ?? 0;
  let settlement = null;

  if (Math.abs(firstNet - secondNet) > 0.01) {
    settlement =
      firstNet > secondNet
        ? { from: second, to: first, amount: Math.round(Math.abs(secondNet) * 100) / 100 }
        : { from: first, to: second, amount: Math.round(Math.abs(firstNet) * 100) / 100 };
  }

  return {
    partnerNames,
    contributions,
    paidExpenses,
    contributionPercentages,
    contributionDifference,
    totalSharedExpenses,
    sharedExpenseNet,
    settlement
  };
};

export const exportTransactionsCsv = async (householdId: string, userId: string, visibility = "shared" as "private" | "shared") => {
  const transactions = await Transaction.find(visibilityFilter(householdId, userId, visibility))
    .populate("categoryId", "name")
    .sort({ date: -1 });

  const rows = [
    ["type", "amount", "category", "description", "date", "paidBy", "splitMode", "isRecurring"],
    ...transactions.map((transaction) => {
      const category = transaction.categoryId as unknown as { name?: string };
      return [
        transaction.type,
        transaction.amount.toString(),
        category.name ?? "",
        transaction.description,
        transaction.date.toISOString(),
        transaction.paidBy,
        transaction.splitMode,
        transaction.isRecurring.toString()
      ];
    })
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
};

export const ensureReportCategories = (householdId: string) => Category.find({ householdId });
