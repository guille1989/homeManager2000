import type { AuthRequest } from "../types/auth";
import { ApiError } from "./ApiError";

export const requireAuthUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication is required");
  }

  return req.user;
};

export const requireHouseholdId = (req: AuthRequest) => {
  const user = requireAuthUser(req);

  if (!user.householdId) {
    throw new ApiError(400, "The user does not belong to a household");
  }

  return user.householdId;
};

