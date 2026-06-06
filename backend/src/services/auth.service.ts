import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Household } from "../models/Household.model";
import { User, type IUser } from "../models/User.model";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { ApiError } from "../utils/ApiError";
import { seedDefaultCategories } from "./category.service";
import { joinHousehold } from "./household.service";

const sanitizeUser = (user: IUser | null) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    householdId: user.householdId?.toString()
  };
};

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  } as jwt.SignOptions);

export const register = async (input: RegisterInput) => {
  const existing = await User.findOne({ email: input.email });

  if (existing) {
    throw new ApiError(409, "Email is already registered");
  }

  const inviteHousehold = input.inviteCode ? await Household.findOne({ inviteCode: input.inviteCode }) : null;

  if (input.inviteCode && !inviteHousehold) {
    throw new ApiError(404, "Invite code not found");
  }

  const usedNames = new Set(inviteHousehold?.members.map((member) => member.name) ?? []);
  const invitedMemberName = inviteHousehold?.partnerNames.find((name) => !usedNames.has(name));
  const userName = input.inviteCode ? invitedMemberName : input.name;

  if (!userName) {
    throw new ApiError(400, "Name is required");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: userName,
    email: input.email,
    passwordHash
  });

  if (input.inviteCode) {
    const household = await joinHousehold(user._id.toString(), userName, { inviteCode: input.inviteCode });
    user.householdId = household._id;

    return {
      token: signToken(user._id.toString()),
      user: sanitizeUser(user),
      household
    };
  }

  const household = await Household.create({
    name: input.householdName ?? `Hogar de ${userName}`,
    currency: input.currency,
    partnerNames: [userName, input.partnerName ?? "Pareja"],
    members: [{ userId: user._id, name: userName, role: "owner" }]
  });

  user.householdId = household._id;
  await user.save();
  await seedDefaultCategories(household._id);

  return {
    token: signToken(user._id.toString()),
    user: sanitizeUser(user),
    household
  };
};

export const login = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  return {
    token: signToken(user._id.toString()),
    user: sanitizeUser(user)
  };
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("name email householdId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const household = user.householdId ? await Household.findById(user.householdId) : null;

  return {
    user: sanitizeUser(user),
    household
  };
};
