import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CategoryPieChart } from "../../components/charts/CategoryPieChart";
import { IncomeExpenseChart } from "../../components/charts/IncomeExpenseChart";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState, LoadingState } from "../../components/ui/State";
import { api, getErrorMessage } from "../../lib/api";
import type { CategoryBreakdown, IncomeExpensePoint, PartnerBalance, Period } from "../../types";
import { money } from "../../utils/format";
import { useAuth } from "../auth/AuthProvider";

type MonthComparison = {
  current: { income: number; expense: number; balance: number };
  previous: { income: number; expense: number; balance: number };
};

export const ReportsPage = () => {
  const [period, setPeriod] = useState<Period>("month");
  const { household } = useAuth();
  const currency = household?.currency ?? "EUR";

  const breakdown = useQuery({
    queryKey: ["category-breakdown", period],
    queryFn: async () =>
      (await api.get<CategoryBreakdown[]>("/reports/category-breakdown", { params: { period } })).data
  });

  const incomeVsExpense = useQuery({
    queryKey: ["income-vs-expense", period],
    queryFn: async () =>
      (await api.get<IncomeExpensePoint[]>("/reports/income-vs-expense", { params: { period } })).data
  });

  const partnerBalance = useQuery({
    queryKey: ["partner-balance", period],
    queryFn: async () =>
      (await api.get<PartnerBalance>("/reports/partner-balance", { params: { period } })).data
  });

  const monthComparison = useQuery({
    queryKey: ["month-comparison"],
    queryFn: async () => (await api.get<MonthComparison>("/reports/month-comparison")).data
  });

  const error = breakdown.error ?? incomeVsExpense.error ?? partnerBalance.error ?? monthComparison.error;

  const exportCsv = async () => {
    const { data } = await api.get<Blob>("/reports/export.csv", { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-3 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">Reportes</h2>
          <p className="text-sm text-muted">Análisis de gastos, ingresos y balance compartido.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="min-h-10 rounded-md border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
          >
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
          <Button type="button" variant="secondary" onClick={exportCsv}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {error ? <ErrorState label={getErrorMessage(error)} /> : null}

      <div className="grid gap-3 sm:gap-5 xl:grid-cols-2">
        <Card className="p-3 sm:p-4">
          <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">Gastos por categoría</h3>
          {breakdown.isLoading ? <LoadingState /> : null}
          {breakdown.data ? <CategoryPieChart data={breakdown.data} currency={currency} /> : null}
        </Card>

        <Card className="p-3 sm:p-4">
          <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">Ingresos vs gastos</h3>
          {incomeVsExpense.isLoading ? <LoadingState /> : null}
          {incomeVsExpense.data ? (
            <IncomeExpenseChart data={incomeVsExpense.data} currency={currency} />
          ) : null}
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-5 xl:grid-cols-2">
        <Card className="p-3 sm:p-4">
          <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">Mes actual vs anterior</h3>
          {monthComparison.data ? (
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <ComparisonBox title="Mes actual" data={monthComparison.data.current} currency={currency} />
              <ComparisonBox title="Mes anterior" data={monthComparison.data.previous} currency={currency} />
            </div>
          ) : (
            <LoadingState />
          )}
        </Card>

        <Card className="p-3 sm:p-4">
          <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">Compensación</h3>
          {partnerBalance.data ? (
            <div className="grid gap-2 sm:gap-3">
              {partnerBalance.data.partnerNames.map((name) => (
                <div key={name} className="flex items-center justify-between rounded-md bg-brand-50 p-2 text-xs sm:p-3 sm:text-sm">
                  <span>{name}</span>
                  <strong>{money(partnerBalance.data.sharedExpenseNet[name] ?? 0, currency)}</strong>
                </div>
              ))}
              <div className="rounded-md bg-brand-50 p-2 text-xs font-semibold text-brand sm:p-3 sm:text-sm">
                {partnerBalance.data.settlement
                  ? `${partnerBalance.data.settlement.from} debe ${money(
                      partnerBalance.data.settlement.amount,
                      currency
                    )} a ${partnerBalance.data.settlement.to}`
                  : "Sin compensación pendiente."}
              </div>
            </div>
          ) : (
            <LoadingState />
          )}
        </Card>
      </div>
    </div>
  );
};

const ComparisonBox = ({
  title,
  data,
  currency
}: {
  title: string;
  data: { income: number; expense: number; balance: number };
  currency: string;
}) => (
  <div className="rounded-lg border border-brand-100 bg-white/80 p-3 sm:p-4">
    <strong className="text-sm sm:text-base">{title}</strong>
    <dl className="mt-2 grid gap-1.5 text-xs sm:mt-3 sm:gap-2 sm:text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Ingresos</dt>
        <dd className="font-semibold text-mint">{money(data.income, currency)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Gastos</dt>
        <dd className="font-semibold text-danger">{money(data.expense, currency)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Balance</dt>
        <dd className="font-semibold text-brand">{money(data.balance, currency)}</dd>
      </div>
    </dl>
  </div>
);

