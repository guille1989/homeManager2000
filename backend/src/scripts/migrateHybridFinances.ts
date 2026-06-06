import mongoose from "mongoose";
import { connectDb } from "../config/db";
import { Budget } from "../models/Budget.model";
import { SavingsGoal } from "../models/SavingsGoal.model";
import { Transaction } from "../models/Transaction.model";

const run = async () => {
  await connectDb();

  const [transactions, budgets, goals] = await Promise.all([
    Transaction.updateMany({ visibility: { $exists: false } }, { $set: { visibility: "shared", splitType: "equal", splitConfig: {} } }),
    Budget.updateMany({ visibility: { $exists: false } }, { $set: { visibility: "shared" } }),
    SavingsGoal.updateMany(
      { visibility: { $exists: false } },
      { $set: { visibility: "shared", type: "shared" } }
    )
  ]);

  console.log("Hybrid finance migration completed");
  console.log(`Transactions updated: ${transactions.modifiedCount}`);
  console.log(`Budgets updated: ${budgets.modifiedCount}`);
  console.log(`Savings goals updated: ${goals.modifiedCount}`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

