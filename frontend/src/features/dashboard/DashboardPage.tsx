import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CategoryPieChart } from "../../components/charts/CategoryPieChart";
import { IncomeExpenseChart } from "../../components/charts/IncomeExpenseChart";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/State";
import { useAuth } from "../auth/AuthProvider";
import { api, getErrorMessage } from "../../lib/api";
import type {
  Budget,
  CategoryBreakdown,
  IncomeExpensePoint,
  PartnerBalance,
  Period,
  Summary,
  Visibility
} from "../../types";
import { money } from "../../utils/format";

const periodLabels: Record<Period, string> = {
  week: "Semana",
  month: "Mes",
  year: "Ano"
};

export const DashboardPage = ({
  visibility = "shared",
  focusBalance = false
}: {
  visibility?: Visibility;
  focusBalance?: boolean;
}) => {
  const [period, setPeriod] = useState<Period>("month");
  const { household } = useAuth();
  const isPrivate = visibility === "private";
  const currency = household?.currency ?? "EUR";

  const summary = useQuery({
    queryKey: ["summary", visibility, period],
    queryFn: async () => (await api.get<Summary>("/reports/summary", { params: { period, visibility } })).data
  });

  const breakdown = useQuery({
    queryKey: ["category-breakdown", visibility, period],
    queryFn: async () =>
      (await api.get<CategoryBreakdown[]>("/reports/category-breakdown", { params: { period, visibility } })).data
  });

  const incomeVsExpense = useQuery({
    queryKey: ["income-vs-expense", visibility, period],
    queryFn: async () =>
      (await api.get<IncomeExpensePoint[]>("/reports/income-vs-expense", { params: { period, visibility } })).data
  });

  const partnerBalance = useQuery({
    queryKey: ["partner-balance", period],
    queryFn: async () => (await api.get<PartnerBalance>("/reports/partner-balance", { params: { period } })).data,
    enabled: !isPrivate
  });

  const budgets = useQuery({
    queryKey: ["budgets", visibility],
    queryFn: async () => {
      const now = new Date();
      return (
        await api.get<Budget[]>("/budgets", {
          params: { visibility, month: now.getMonth() + 1, year: now.getFullYear() }
        })
      ).data;
    }
  });

  const isLoading =
    summary.isLoading || breakdown.isLoading || incomeVsExpense.isLoading || partnerBalance.isLoading || budgets.isLoading;
  const error = summary.error ?? breakdown.error ?? incomeVsExpense.error ?? partnerBalance.error ?? budgets.error;

  return (
    <div className="grid gap-3 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">
            {isPrivate ? "Mi economia" : focusBalance ? "Balance entre Miembros" : "Dashboard Compartido"}
          </h2>
          <p className="text-sm text-muted">
            {isPrivate ? "Ingresos personales, gastos privados y tu parte de los gastos del hogar." : "Vista de gastos compartidos del hogar."}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-brand-100 bg-white p-1">
          {(Object.keys(periodLabels) as Period[]).map((item) => (
            <button
              key={item}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm ${
                period === item ? "bg-brand text-white" : "text-slate-600 hover:bg-brand-50"
              }`}
              onClick={() => setPeriod(item)}
            >
              {periodLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState label={getErrorMessage(error)} /> : null}
      {isLoading ? <LoadingState /> : null}

      {summary.data ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
          {isPrivate ? (
            <>
              <Metric title="Mis ingresos" value={money(summary.data.income, currency)} tone="text-mint" />
              <Metric title="Mis gastos" value={money(summary.data.expense, currency)} tone="text-danger" />
              <Metric title="Mi balance" value={money(summary.data.balance, currency)} tone="text-brand" />
              <Metric title="Mi ahorro mensual" value={money(summary.data.estimatedSavings, currency)} tone="text-ink" />
            </>
          ) : (
            <>
              <Metric title="Gastos compartidos" value={money(summary.data.expense, currency)} tone="text-danger" />
              <Metric title="Impacto del periodo" value={money(summary.data.balance, currency)} tone="text-brand" />
            </>
          )}
        </div>
      ) : null}

      {!focusBalance ? (
        <div className="grid gap-3 sm:gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-3 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base font-bold text-ink sm:text-lg">Gastos por categoria</h3>
              <p className="text-xs text-muted sm:text-sm">Distribucion del periodo seleccionado.</p>
            </div>
            {breakdown.data?.length ? (
              <>
                <CategoryPieChart data={breakdown.data} currency={currency} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {breakdown.data.map((item) => (
                    <div key={item.categoryId} className="min-w-0 rounded-md bg-brand-50 p-2 text-xs sm:flex sm:items-center sm:justify-between sm:bg-transparent sm:p-0 sm:text-sm">
                      <span className="flex min-w-0 items-center gap-1.5 text-muted sm:gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <strong className="mt-1 block truncate sm:mt-0">{money(item.total, currency)}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState label="Aun no hay gastos en este periodo." />
            )}
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base font-bold text-ink sm:text-lg">Ingresos vs gastos</h3>
              <p className="text-xs text-muted sm:text-sm">Comparativa temporal del periodo.</p>
            </div>
            {incomeVsExpense.data?.length ? (
              <IncomeExpenseChart data={incomeVsExpense.data} currency={currency} />
            ) : (
              <EmptyState label="Registra movimientos para ver la evolucion." />
            )}
          </Card>
        </div>
      ) : null}

      {!focusBalance ? (
        <div className="grid gap-3 sm:gap-5 xl:grid-cols-2">
          <Card className="p-3 sm:p-4">
            <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">{isPrivate ? "Mis metas personales" : "Metas compartidas"}</h3>
            {summary.data?.goals.length ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {summary.data.goals.map((goal) => (
                  <div key={goal.id} className="rounded-md bg-brand-50 p-2 sm:bg-transparent sm:p-0">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <strong className="truncate">{goal.name}</strong>
                      <span className="text-muted">{goal.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-brand-100 sm:h-3">
                      <div className="h-full rounded-full" style={{ width: `${goal.percentage}%`, background: goal.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="Crea una meta de ahorro para seguir su avance." />
            )}
          </Card>

          <Card className="p-3 sm:p-4">
            <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">{isPrivate ? "Mis presupuestos" : "Presupuestos compartidos"}</h3>
            {budgets.data?.length ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {budgets.data.slice(0, 5).map((budget) => (
                  <div key={budget._id} className="rounded-md bg-brand-50 p-2 sm:p-3">
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <strong className="truncate">{budget.categoryId.name}</strong>
                      <span className="text-muted">{budget.percentage}%</span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted sm:text-sm">
                      {money(budget.spent, currency)} de {money(budget.limit, currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No hay presupuestos para este mes." />
            )}
          </Card>
        </div>
      ) : null}

      {!isPrivate ? (
        <Card className="p-3 sm:p-4">
          <h3 className="mb-3 text-base font-bold text-ink sm:mb-4 sm:text-lg">Aportacion de cada miembro</h3>
          {partnerBalance.data ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {partnerBalance.data.partnerNames.map((name) => (
                <div key={name} className="rounded-md bg-brand-50 p-2 sm:p-3">
                  <div className="grid gap-1 text-xs sm:flex sm:items-center sm:justify-between sm:text-sm">
                    <strong className="truncate">{name}</strong>
                    <span className="truncate text-muted">Pago {money(partnerBalance.data.paidExpenses[name] ?? 0, currency)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted sm:text-sm">
                    Aportacion: {partnerBalance.data.contributionPercentages[name] ?? 0}%
                  </p>
                </div>
              ))}
              <div className="rounded-md bg-brand-50 p-2 text-xs font-semibold text-ink sm:p-3 sm:text-sm">
                Diferencia entre aportaciones: {money(partnerBalance.data.contributionDifference, currency)}
              </div>
              <div className="rounded-md bg-brand-50 p-2 text-xs font-semibold text-brand sm:p-3 sm:text-sm">
                {partnerBalance.data.settlement
                  ? `${partnerBalance.data.settlement.from} debe compensar a ${partnerBalance.data.settlement.to} con ${money(
                      partnerBalance.data.settlement.amount,
                      currency
                    )}`
                  : "No hay compensacion pendiente en este periodo."}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
};

const Metric = ({ title, value, tone }: { title: string; value: string; tone: string }) => (
  <Card className="p-2.5 sm:p-4">
    <p className="truncate text-[11px] font-medium text-muted sm:text-sm">{title}</p>
    <p className={`mt-1 truncate text-base font-bold sm:mt-2 sm:text-2xl ${tone}`}>{value}</p>
  </Card>
);
