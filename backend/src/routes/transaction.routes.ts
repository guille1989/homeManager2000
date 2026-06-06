import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idParamSchema } from "../schemas/common.schema";
import {
  createTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema
} from "../schemas/transaction.schema";

export const transactionRoutes = Router();

transactionRoutes.use(authenticate);
transactionRoutes.get("/", validate({ query: transactionQuerySchema }), transactionController.list);
transactionRoutes.post("/", validate({ body: createTransactionSchema }), transactionController.create);
transactionRoutes.get("/:id", validate({ params: idParamSchema }), transactionController.get);
transactionRoutes.put(
  "/:id",
  validate({ params: idParamSchema, body: updateTransactionSchema }),
  transactionController.update
);
transactionRoutes.delete("/:id", validate({ params: idParamSchema }), transactionController.remove);

