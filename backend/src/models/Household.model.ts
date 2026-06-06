import { Schema, Types, model, type Document } from "mongoose";

export interface IHousehold extends Document {
  _id: Types.ObjectId;
  name: string;
  currency: string;
  partnerNames: string[];
  members: Array<{
    userId: Types.ObjectId;
    name: string;
    role: "owner" | "member";
  }>;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdSchema = new Schema<IHousehold>(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, required: true, default: "EUR", uppercase: true, trim: true },
    partnerNames: {
      type: [String],
      required: true,
      default: ["Persona 1", "Persona 2"],
      validate: {
        validator: (value: string[]) => value.length === 2,
        message: "A household must have exactly two partner names"
      }
    },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        role: { type: String, enum: ["owner", "member"], default: "member" }
      }
    ],
    inviteCode: { type: String, unique: true, sparse: true }
  },
  { timestamps: true, collection: "households" }
);

HouseholdSchema.index({ "members.userId": 1 });

export const Household = model<IHousehold>("Household", HouseholdSchema);
