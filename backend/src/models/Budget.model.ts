import { Schema, Types, model, type Document } from "mongoose";

export interface IBudget extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  visibility: "private" | "shared";
  ownerId?: Types.ObjectId;
  categoryId: Types.ObjectId;
  month: number;
  year: number;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    visibility: { type: String, enum: ["private", "shared"], default: "shared", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    limit: { type: Number, required: true, min: 0 }
  },
  { timestamps: true, collection: "budgets" }
);

BudgetSchema.index(
  { householdId: 1, visibility: 1, ownerId: 1, categoryId: 1, month: 1, year: 1 },
  { unique: true }
);

export const Budget = model<IBudget>("Budget", BudgetSchema);
