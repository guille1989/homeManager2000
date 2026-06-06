import { Router } from "express";
import * as budgetController from "../controllers/budget.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createBudgetSchema, budgetQuerySchema, updateBudgetSchema } from "../schemas/budget.schema";
import { idParamSchema } from "../schemas/common.schema";

export const budgetRoutes = Router();

budgetRoutes.use(authenticate);
budgetRoutes.get("/", validate({ query: budgetQuerySchema }), budgetController.list);
budgetRoutes.post("/", validate({ body: createBudgetSchema }), budgetController.create);
budgetRoutes.put(
  "/:id",
  validate({ params: idParamSchema, body: updateBudgetSchema }),
  budgetController.update
);
budgetRoutes.delete("/:id", validate({ params: idParamSchema }), budgetController.remove);

