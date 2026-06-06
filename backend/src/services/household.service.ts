import crypto from "crypto";
import { Budget } from "../models/Budget.model";
import { GoalContribution } from "../models/GoalContribution.model";
import { Household } from "../models/Household.model";
import { RecurringTransaction } from "../models/RecurringTransaction.model";
import { SavingsGoal } from "../models/SavingsGoal.model";
import { Transaction } from "../models/Transaction.model";
import { User } from "../models/User.model";
import type { CreateHouseholdInput, JoinHouseholdInput, UpdateHouseholdInput } from "../schemas/household.schema";
import { ApiError } from "../utils/ApiError";
import { seedDefaultCategories } from "./category.service";

export const createHousehold = async (userId: string, userName: string, input: CreateHouseholdInput) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.householdId) {
    throw new ApiError(409, "User already belongs to a household");
  }

  const household = await Household.create({
    ...input,
    members: [{ userId: user._id, name: userName, role: "owner" }]
  });

  user.householdId = household._id;
  await user.save();
  await seedDefaultCategories(household._id);

  return household;
};

export const getCurrentHousehold = async (householdId: string) => {
  const household = await Household.findById(householdId);

  if (!household) {
    throw new ApiError(404, "Household not found");
  }

  return household;
};

export const updateHousehold = async (
  householdId: string,
  id: string,
  input: UpdateHouseholdInput
) => {
  if (householdId !== id) {
    throw new ApiError(403, "Cannot update another household");
  }

  const household = await Household.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true
  });

  if (!household) {
    throw new ApiError(404, "Household not found");
  }

  return household;
};

export const createInvite = async (householdId: string, id: string) => {
  if (householdId !== id) {
    throw new ApiError(403, "Cannot invite to another household");
  }

  const existingHousehold = await Household.findById(id);

  if (!existingHousehold) {
    throw new ApiError(404, "Household not found");
  }

  if (existingHousehold.members.length >= existingHousehold.partnerNames.length) {
    throw new ApiError(409, "Household already has all members");
  }

  const inviteCode = crypto.randomBytes(8).toString("hex");
  const household = await Household.findByIdAndUpdate(
    id,
    { inviteCode },
    { new: true, runValidators: true }
  );

  if (!household) {
    throw new ApiError(404, "Household not found");
  }

  return { inviteCode, household };
};

export const joinHousehold = async (userId: string, userName: string, input: JoinHouseholdInput) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.householdId) {
    throw new ApiError(409, "User already belongs to a household");
  }

  const household = await Household.findOne({ inviteCode: input.inviteCode });

  if (!household) {
    throw new ApiError(404, "Invite code not found");
  }

  if (household.members.some((member) => member.userId.toString() === userId)) {
    throw new ApiError(409, "User already belongs to this household");
  }

  if (household.members.length >= household.partnerNames.length) {
    throw new ApiError(409, "Household already has all members");
  }

  const usedNames = new Set(household.members.map((member) => member.name));
  const matchingPartnerName = household.partnerNames.find(
    (name) => name.localeCompare(userName, undefined, { sensitivity: "accent" }) === 0
  );
  const memberName = matchingPartnerName ?? household.partnerNames.find((name) => !usedNames.has(name)) ?? userName;

  household.members.push({
    userId: user._id,
    name: memberName,
    role: "member"
  });
  household.inviteCode = undefined;
  user.householdId = household._id;

  await Promise.all([household.save(), user.save()]);

  return household;
};

export const clearHouseholdData = async (householdId: string, id: string) => {
  if (householdId !== id) {
    throw new ApiError(403, "Cannot clear another household");
  }

  await Promise.all([
    Transaction.deleteMany({ householdId }),
    Budget.deleteMany({ householdId }),
    SavingsGoal.deleteMany({ householdId }),
    GoalContribution.deleteMany({ householdId }),
    RecurringTransaction.deleteMany({ householdId })
  ]);

  return { deleted: true };
};
