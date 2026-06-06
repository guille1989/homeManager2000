import { Schema, Types, model, type Document } from "mongoose";

export type CategoryType = "income" | "expense" | "both";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  householdId: Types.ObjectId;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    householdId: { type: Schema.Types.ObjectId, ref: "Household", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense", "both"], default: "expense" },
    color: { type: String, required: true, default: "#448481" },
    icon: { type: String },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true, collection: "categories" }
);

CategorySchema.index({ householdId: 1, name: 1 }, { unique: true });
CategorySchema.index({ householdId: 1, type: 1 });

export const Category = model<ICategory>("Category", CategorySchema);
