import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const notFoundHandler = () => {
  throw new ApiError(404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  console.error(error);
  return res.status(500).json({
    message: "Internal server error"
  });
};

