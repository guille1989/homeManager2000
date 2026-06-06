import type { Response } from "express";
import type { AuthRequest } from "../types/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuthUser } from "../utils/authContext";
import * as authService from "../services/auth.service";

export const register = asyncHandler(async (req, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireAuthUser(req);
  const result = await authService.getMe(user.id);
  res.json(result);
});

