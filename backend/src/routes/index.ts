import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { budgetRoutes } from "./budget.routes";
import { categoryRoutes } from "./category.routes";
import { householdRoutes } from "./household.routes";
import { reportRoutes } from "./report.routes";
import { savingsGoalRoutes } from "./savingsGoal.routes";
import { transactionRoutes } from "./transaction.routes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/households", householdRoutes);
apiRoutes.use("/transactions", transactionRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/budgets", budgetRoutes);
apiRoutes.use("/savings-goals", savingsGoalRoutes);
apiRoutes.use("/reports", reportRoutes);

