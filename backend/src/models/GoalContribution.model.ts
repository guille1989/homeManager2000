import { Schema, Types, model, type Document } from "mongoose";

export interface IGoalContribution extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  goalId: Types.ObjectId;
  amount: number;
  date: Date;
  contributedBy: string;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalContributionSchema = new Schema<IGoalContribution>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "SavingsGoal", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true },
    contributedBy: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, collection: "goalContributions" }
);

GoalContributionSchema.index({ householdId: 1, goalId: 1, date: -1 });

export const GoalContribution = model<IGoalContribution>("GoalContribution", GoalContributionSchema);

