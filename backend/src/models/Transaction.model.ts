import { Schema, Types, model, type Document } from "mongoose";

export type TransactionType = "income" | "expense";
export type SplitMode = "individual" | "shared";
export type Visibility = "private" | "shared";
export type SplitType = "equal" | "percentage" | "custom";

export type SplitConfig = {
  shares?: Record<string, number>;
};

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  categoryId: Types.ObjectId;
  description: string;
  date: Date;
  paidBy: string;
  splitMode: SplitMode;
  visibility: Visibility;
  ownerId?: Types.ObjectId;
  splitType: SplitType;
  splitConfig?: SplitConfig;
  isRecurring: boolean;
  createdBy: Types.ObjectId;
  recurringTransactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, trim: true, default: "" },
    date: { type: Date, required: true },
    paidBy: { type: String, required: true, trim: true },
    splitMode: { type: String, enum: ["individual", "shared"], default: "shared" },
    visibility: { type: String, enum: ["private", "shared"], default: "shared", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    splitType: { type: String, enum: ["equal", "percentage", "custom"], default: "equal" },
    splitConfig: { type: Schema.Types.Mixed, default: {} },
    isRecurring: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recurringTransactionId: { type: Schema.Types.ObjectId, ref: "RecurringTransaction" }
  },
  { timestamps: true, collection: "transactions" }
);

TransactionSchema.index({ householdId: 1, date: -1 });
TransactionSchema.index({ householdId: 1, type: 1, date: -1 });
TransactionSchema.index({ householdId: 1, categoryId: 1, date: -1 });
TransactionSchema.index({ householdId: 1, paidBy: 1, date: -1 });
TransactionSchema.index({ householdId: 1, visibility: 1, ownerId: 1, date: -1 });

export const Transaction = model<ITransaction>("Transaction", TransactionSchema);
