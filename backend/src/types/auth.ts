import type { Request } from "express";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  householdId?: string;
};

export interface AuthRequest extends Request {
  user?: AuthUser;
}

