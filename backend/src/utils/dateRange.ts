export type Period = "week" | "month" | "year";

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const getDateRange = (period: Period = "month", dateValue?: string) => {
  const base = dateValue ? new Date(dateValue) : new Date();

  if (Number.isNaN(base.getTime())) {
    throw new Error("Invalid date");
  }

  if (period === "week") {
    const start = startOfDay(base);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    const end = endOfDay(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  if (period === "year") {
    return {
      start: new Date(base.getFullYear(), 0, 1),
      end: new Date(base.getFullYear(), 11, 31, 23, 59, 59, 999)
    };
  }

  return {
    start: new Date(base.getFullYear(), base.getMonth(), 1),
    end: new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999)
  };
};

export const getMonthYear = (dateValue?: string) => {
  const base = dateValue ? new Date(dateValue) : new Date();
  return {
    month: base.getMonth() + 1,
    year: base.getFullYear()
  };
};

