import { format } from "date-fns";
import { es } from "date-fns/locale";

export const money = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency
  }).format(value);

export const dateInput = (date: string | Date) => format(new Date(date), "yyyy-MM-dd");

export const shortDate = (date: string | Date) =>
  format(new Date(date), "dd MMM yyyy", { locale: es });

export const currentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

