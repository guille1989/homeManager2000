import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDb } from "../config/db";
import { Budget } from "../models/Budget.model";
import { Category } from "../models/Category.model";
import { GoalContribution } from "../models/GoalContribution.model";
import { Household } from "../models/Household.model";
import { RecurringTransaction } from "../models/RecurringTransaction.model";
import { SavingsGoal } from "../models/SavingsGoal.model";
import { Transaction } from "../models/Transaction.model";
import { User } from "../models/User.model";
import { defaultCategories } from "../services/category.service";

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const run = async () => {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Household.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    SavingsGoal.deleteMany({}),
    GoalContribution.deleteMany({}),
    RecurringTransaction.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("password123", 12);
  const ana = await User.create({
    name: "Ana",
    email: "ana@example.com",
    passwordHash
  });

  const household = await Household.create({
    name: "Casa Ana y Luis",
    currency: "EUR",
    partnerNames: ["Ana", "Luis"],
    members: [{ userId: ana._id, name: "Ana", role: "owner" }]
  });

  ana.householdId = household._id;
  await ana.save();

  const categories = await Category.insertMany([
    ...defaultCategories.map((category) => ({
      ...category,
      householdId: household._id,
      type: category.name === "Ahorro" ? "both" : "expense",
      isDefault: true
    })),
    {
      householdId: household._id,
      name: "Nómina",
      type: "income",
      color: "#59b2b0",
      isDefault: false
    }
  ]);

  const byName = (name: string) => {
    const category = categories.find((item) => item.name === name);
    if (!category) throw new Error(`Missing category ${name}`);
    return category._id;
  };

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  await Transaction.insertMany([
    {
      householdId: household._id,
      type: "income",
      amount: 2400,
      categoryId: byName("Nómina"),
      description: "Nómina Ana",
      date: new Date(currentYear, today.getMonth(), 1),
      paidBy: "Ana",
      splitMode: "individual",
      createdBy: ana._id
    },
    {
      householdId: household._id,
      type: "income",
      amount: 2200,
      categoryId: byName("Nómina"),
      description: "Nómina Luis",
      date: new Date(currentYear, today.getMonth(), 1),
      paidBy: "Luis",
      splitMode: "individual",
      createdBy: ana._id
    },
    {
      householdId: household._id,
      type: "expense",
      amount: 950,
      categoryId: byName("Alquiler / Hipoteca"),
      description: "Alquiler mensual",
      date: new Date(currentYear, today.getMonth(), 2),
      paidBy: "Ana",
      splitMode: "shared",
      isRecurring: true,
      createdBy: ana._id
    },
    {
      householdId: household._id,
      type: "expense",
      amount: 180,
      categoryId: byName("Supermercado"),
      description: "Compra semanal",
      date: addDays(today, -4),
      paidBy: "Luis",
      splitMode: "shared",
      createdBy: ana._id
    },
    {
      householdId: household._id,
      type: "expense",
      amount: 68,
      categoryId: byName("Comida fuera"),
      description: "Cena",
      date: addDays(today, -2),
      paidBy: "Ana",
      splitMode: "shared",
      createdBy: ana._id
    },
    {
      householdId: household._id,
      type: "expense",
      amount: 42,
      categoryId: byName("Transporte"),
      description: "Abono transporte",
      date: addDays(today, -1),
      paidBy: "Luis",
      splitMode: "individual",
      createdBy: ana._id
    }
  ]);

  await Budget.insertMany([
    {
      householdId: household._id,
      categoryId: byName("Supermercado"),
      month: currentMonth,
      year: currentYear,
      limit: 500
    },
    {
      householdId: household._id,
      categoryId: byName("Comida fuera"),
      month: currentMonth,
      year: currentYear,
      limit: 220
    },
    {
      householdId: household._id,
      categoryId: byName("Ocio"),
      month: currentMonth,
      year: currentYear,
      limit: 180
    }
  ]);

  const goal = await SavingsGoal.create({
    householdId: household._id,
    name: "Fondo de emergencia",
    targetAmount: 6000,
    currentAmount: 1200,
    targetDate: new Date(currentYear + 1, today.getMonth(), 1),
    color: "#59b2b0",
    createdBy: ana._id
  });

  await GoalContribution.create({
    householdId: household._id,
    goalId: goal._id,
    amount: 300,
    date: addDays(today, -7),
    contributedBy: "Ana",
    note: "Aportación inicial",
    createdBy: ana._id
  });

  await RecurringTransaction.create({
    householdId: household._id,
    type: "expense",
    amount: 950,
    categoryId: byName("Alquiler / Hipoteca"),
    description: "Alquiler mensual",
    paidBy: "Ana",
    splitMode: "shared",
    frequency: "monthly",
    nextRunAt: new Date(currentYear, today.getMonth() + 1, 2),
    active: true,
    createdBy: ana._id
  });

  console.log("Seed completed");
  console.log("Login: ana@example.com / password123");
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
