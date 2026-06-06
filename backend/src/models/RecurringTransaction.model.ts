import { Schema, Types, model, type Document } from "mongoose";
import type { SplitMode, TransactionType } from "./Transaction.model";

export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export interface IRecurringTransaction extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  categoryId: Types.ObjectId;
  description: string;
  paidBy: string;
  splitMode: SplitMode;
  frequency: RecurringFrequency;
  nextRunAt: Date;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, trim: true, default: "" },
    paidBy: { type: String, required: true, trim: true },
    splitMode: { type: String, enum: ["individual", "shared"], default: "shared" },
    frequency: { type: String, enum: ["weekly", "monthly", "yearly"], required: true },
    nextRunAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, collection: "recurringTransactions" }
);

RecurringTransactionSchema.index({ householdId: 1, active: 1, nextRunAt: 1 });

export const RecurringTransaction = model<IRecurringTransaction>(
  "RecurringTransaction",
  RecurringTransactionSchema
);

