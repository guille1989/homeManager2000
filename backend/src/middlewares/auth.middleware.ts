import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User.model";
import type { AuthRequest } from "../types/auth";
import { ApiError } from "../utils/ApiError";

type JwtPayload = {
  sub: string;
};

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "Authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(payload.sub).select("name email householdId");

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      householdId: user.householdId?.toString()
    };

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

