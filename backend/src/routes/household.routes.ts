import { Router } from "express";
import * as householdController from "../controllers/household.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idParamSchema } from "../schemas/common.schema";
import { createHouseholdSchema, joinHouseholdSchema, updateHouseholdSchema } from "../schemas/household.schema";

export const householdRoutes = Router();

householdRoutes.use(authenticate);
householdRoutes.post("/", validate({ body: createHouseholdSchema }), householdController.create);
householdRoutes.get("/current", householdController.current);
householdRoutes.post("/join", validate({ body: joinHouseholdSchema }), householdController.join);
householdRoutes.put(
  "/:id",
  validate({ params: idParamSchema, body: updateHouseholdSchema }),
  householdController.update
);
householdRoutes.post("/:id/invite", validate({ params: idParamSchema }), householdController.invite);
householdRoutes.delete("/:id/data", validate({ params: idParamSchema }), householdController.clearData);
