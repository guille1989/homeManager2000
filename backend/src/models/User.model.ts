import { Schema, Types, model, type Document } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household" }
  },
  { timestamps: true, collection: "users" }
);

export const User = model<IUser>("User", UserSchema);
