import { Schema, Types, model, type Document } from "mongoose";

export interface ISavingsGoal extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  visibility: "private" | "shared";
  ownerId?: Types.ObjectId;
  type: "personal" | "shared";
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  color: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    visibility: { type: String, enum: ["private", "shared"], default: "shared", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: ["personal", "shared"], default: "shared" },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    color: { type: String, default: "#59b2b0" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, collection: "savingsGoals" }
);

SavingsGoalSchema.index({ householdId: 1, targetDate: 1 });
SavingsGoalSchema.index({ householdId: 1, visibility: 1, ownerId: 1, targetDate: 1 });

export const SavingsGoal = model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema);
