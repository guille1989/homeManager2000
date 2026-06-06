import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { periodQuerySchema } from "../schemas/common.schema";

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.get("/summary", validate({ query: periodQuerySchema }), reportController.summary);
reportRoutes.get(
  "/category-breakdown",
  validate({ query: periodQuerySchema }),
  reportController.categoryBreakdown
);
reportRoutes.get(
  "/income-vs-expense",
  validate({ query: periodQuerySchema }),
  reportController.incomeVsExpense
);
reportRoutes.get(
  "/partner-balance",
  validate({ query: periodQuerySchema }),
  reportController.partnerBalance
);
reportRoutes.get("/month-comparison", reportController.monthComparison);
reportRoutes.get("/export.csv", reportController.csv);

