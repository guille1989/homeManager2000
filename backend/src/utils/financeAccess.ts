import { Types } from "mongoose";

export type Visibility = "private" | "shared";

export const normalizeVisibility = (visibility?: Visibility) => visibility ?? "shared";

export const ownershipFields = (visibility: Visibility, userId: string) =>
  visibility === "private" ? { ownerId: new Types.ObjectId(userId) } : { ownerId: undefined };

export const visibilityFilter = (householdId: string, userId: string, visibility: Visibility) => ({
  householdId: new Types.ObjectId(householdId),
  visibility,
  ...(visibility === "private" ? { ownerId: new Types.ObjectId(userId) } : {})
});

