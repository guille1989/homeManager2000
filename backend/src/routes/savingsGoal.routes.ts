import { Router } from "express";
import * as savingsGoalController from "../controllers/savingsGoal.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idParamSchema } from "../schemas/common.schema";
import {
  createContributionSchema,
  createSavingsGoalSchema,
  updateSavingsGoalSchema
} from "../schemas/savingsGoal.schema";
import { visibilityQuerySchema } from "../schemas/common.schema";

export const savingsGoalRoutes = Router();

savingsGoalRoutes.use(authenticate);
savingsGoalRoutes.get("/", validate({ query: visibilityQuerySchema }), savingsGoalController.list);
savingsGoalRoutes.post("/", validate({ body: createSavingsGoalSchema }), savingsGoalController.create);
savingsGoalRoutes.put(
  "/:id",
  validate({ params: idParamSchema, body: updateSavingsGoalSchema }),
  savingsGoalController.update
);
savingsGoalRoutes.delete("/:id", validate({ params: idParamSchema }), savingsGoalController.remove);
savingsGoalRoutes.post(
  "/:id/contributions",
  validate({ params: idParamSchema, body: createContributionSchema }),
  savingsGoalController.contribute
);
