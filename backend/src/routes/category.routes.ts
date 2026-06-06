import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";
import { idParamSchema } from "../schemas/common.schema";

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);
categoryRoutes.get("/", categoryController.list);
categoryRoutes.post("/", validate({ body: createCategorySchema }), categoryController.create);
categoryRoutes.put(
  "/:id",
  validate({ params: idParamSchema, body: updateCategorySchema }),
  categoryController.update
);
categoryRoutes.delete("/:id", validate({ params: idParamSchema }), categoryController.remove);

