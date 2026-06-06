import { GoalContribution } from "../models/GoalContribution.model";
import { SavingsGoal, type ISavingsGoal } from "../models/SavingsGoal.model";
import type {
  CreateContributionInput,
  CreateSavingsGoalInput,
  SavingsGoalQuery,
  UpdateSavingsGoalInput
} from "../schemas/savingsGoal.schema";
import { ApiError } from "../utils/ApiError";
import { normalizeVisibility, ownershipFields, visibilityFilter } from "../utils/financeAccess";

const withComputedFields = (goal: ISavingsGoal | null) => {
  if (!goal) return null;

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const target = new Date(goal.targetDate);
  const now = new Date();
  const monthsLeft = Math.max(
    (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth(),
    1
  );

  return {
    ...goal.toObject(),
    percentage: Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100),
    remaining,
    monthlyRequired: Math.ceil((remaining / monthsLeft) * 100) / 100
  };
};

export const listSavingsGoals = async (householdId: string, userId: string, query: SavingsGoalQuery) => {
  const visibility = normalizeVisibility(query.visibility);
  const goals = await SavingsGoal.find(visibilityFilter(householdId, userId, visibility)).sort({ targetDate: 1 });
  return goals.map((goal) => withComputedFields(goal));
};

export const createSavingsGoal = (
  householdId: string,
  userId: string,
  input: CreateSavingsGoalInput
) => {
  const visibility = normalizeVisibility(input.visibility);
  return SavingsGoal.create({
    ...input,
    visibility,
    type: visibility === "private" ? "personal" : "shared",
    ...ownershipFields(visibility, userId),
    householdId,
    createdBy: userId
  });
};

export const updateSavingsGoal = async (
  householdId: string,
  userId: string,
  id: string,
  input: UpdateSavingsGoalInput
) => {
  const existing = await SavingsGoal.findOne({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!existing) {
    throw new ApiError(404, "Savings goal not found");
  }

  const visibility = normalizeVisibility(input.visibility ?? existing.visibility);
  const update =
    visibility === "private"
      ? { ...input, visibility, type: "personal", ownerId: userId }
      : { ...input, visibility, type: "shared", $unset: { ownerId: "" } };

  const goal = await SavingsGoal.findOneAndUpdate({ _id: id, householdId }, update, {
    new: true,
    runValidators: true
  });

  if (!goal) {
    throw new ApiError(404, "Savings goal not found");
  }

  return withComputedFields(goal);
};

export const deleteSavingsGoal = async (householdId: string, userId: string, id: string) => {
  const goal = await SavingsGoal.findOneAndDelete({
    _id: id,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!goal) {
    throw new ApiError(404, "Savings goal not found");
  }

  await GoalContribution.deleteMany({ householdId, goalId: id });
  return goal;
};

export const addContribution = async (
  householdId: string,
  userId: string,
  goalId: string,
  input: CreateContributionInput
) => {
  const goal = await SavingsGoal.findOne({
    _id: goalId,
    $or: [
      { householdId, visibility: "shared" },
      { householdId, visibility: "private", ownerId: userId }
    ]
  });

  if (!goal) {
    throw new ApiError(404, "Savings goal not found");
  }

  const contribution = await GoalContribution.create({
    ...input,
    householdId,
    goalId,
    createdBy: userId
  });

  goal.currentAmount += input.amount;
  await goal.save();

  return {
    contribution,
    goal: withComputedFields(goal)
  };
};
