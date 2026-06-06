import { Types } from "mongoose";
import { Category } from "../models/Category.model";
import type { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema";
import { ApiError } from "../utils/ApiError";

export const defaultCategories = [
  { name: "Alquiler / Hipoteca", color: "#1f293d" },
  { name: "Supermercado", color: "#59b2b0" },
  { name: "Servicios", color: "#448481" },
  { name: "Transporte", color: "#353d54" },
  { name: "Comida fuera", color: "#8cf4ee" },
  { name: "Salud", color: "#c5efec" },
  { name: "Ocio", color: "#59b2b0" },
  { name: "Suscripciones", color: "#448481" },
  { name: "Deudas", color: "#353d54" },
  { name: "Ahorro", color: "#8cf4ee" },
  { name: "Otros", color: "#1f293d" }
];

export const seedDefaultCategories = async (householdId: string | Types.ObjectId) => {
  const existing = await Category.countDocuments({ householdId });

  if (existing > 0) {
    return;
  }

  await Category.insertMany(
    defaultCategories.map((category) => ({
      ...category,
      householdId,
      type: category.name === "Ahorro" ? "both" : "expense",
      isDefault: true
    }))
  );
};

export const listCategories = (householdId: string) =>
  Category.find({ householdId }).sort({ isDefault: -1, name: 1 });

export const createCategory = (householdId: string, input: CreateCategoryInput) =>
  Category.create({ ...input, householdId, isDefault: false });

export const updateCategory = async (householdId: string, id: string, input: UpdateCategoryInput) => {
  const category = await Category.findOneAndUpdate({ _id: id, householdId }, input, {
    new: true,
    runValidators: true
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

export const deleteCategory = async (householdId: string, id: string) => {
  const category = await Category.findOneAndDelete({ _id: id, householdId });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};
