import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { EditIcon, PlusIcon, TrashIcon } from "../../components/ui/Icons";
import { Sheet } from "../../components/ui/Sheet";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/State";
import { api, getErrorMessage } from "../../lib/api";
import type { Category, CategoryBreakdown, PartnerBalance, Period, Summary, Transaction, TransactionListResponse } from "../../types";
import { dateInput, money, shortDate } from "../../utils/format";
import { useAuth } from "../auth/AuthProvider";
import { MonthlyCarousel } from "./MonthlyCarousel";

type QuickType = "private-income" | "private-expense" | "shared-expense";

const quickSchema = z.object({
  quickType: z.enum(["private-income", "private-expense", "shared-expense"]),
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  categoryId: z.string().min(1, "Selecciona una categoria"),
  date: z.string().min(1, "Selecciona una fecha"),
  paidBy: z.string().min(1, "Selecciona quien pago"),
  description: z.string().max(200)
});

type QuickForm = z.infer<typeof quickSchema>;

const editSchema = z.object({
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  categoryId: z.string().min(1, "Selecciona una categoria"),
  date: z.string().min(1, "Selecciona una fecha"),
  paidBy: z.string().min(1, "Selecciona quien pago"),
  description: z.string().max(200)
});

type EditForm = z.infer<typeof editSchema>;

const defaultQuickValues: QuickForm = {
  quickType: "private-expense",
  amount: 0,
  categoryId: "",
  date: dateInput(new Date()),
  paidBy: "",
  description: ""
};

const period: Period = "month";

export const HomePage = () => {
  const { household, user } = useAuth();
  const currency = household?.currency ?? "EUR";
  const partnerNames = household?.partnerNames ?? [];
  const userName = user?.name ?? partnerNames[0] ?? "Yo";
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [spendingExpensesOpen, setSpendingExpensesOpen] = useState(false);
  const [householdExpensesOpen, setHouseholdExpensesOpen] = useState(false);
  const [householdExpensesPage, setHouseholdExpensesPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const monthRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: dateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: dateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
  }, []);

  const personalSummary = useQuery({
    queryKey: ["summary", "private", period],
    queryFn: async () => (await api.get<Summary>("/reports/summary", { params: { period, visibility: "private" } })).data
  });

  const householdSummary = useQuery({
    queryKey: ["summary", "shared", period],
    queryFn: async () => (await api.get<Summary>("/reports/summary", { params: { period, visibility: "shared" } })).data
  });

  const personalBreakdown = useQuery({
    queryKey: ["category-breakdown", "private", period],
    queryFn: async () =>
      (await api.get<CategoryBreakdown[]>("/reports/category-breakdown", { params: { period, visibility: "private" } })).data
  });

  const sharedBreakdown = useQuery({
    queryKey: ["category-breakdown", "shared", period],
    queryFn: async () =>
      (await api.get<CategoryBreakdown[]>("/reports/category-breakdown", { params: { period, visibility: "shared" } })).data
  });

  const partnerBalance = useQuery({
    queryKey: ["partner-balance", period],
    queryFn: async () => (await api.get<PartnerBalance>("/reports/partner-balance", { params: { period } })).data
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data
  });

  const householdExpenses = useQuery({
    queryKey: ["transactions", "shared", "home-table", householdExpensesPage],
    queryFn: async () =>
      (
        await api.get<TransactionListResponse>("/transactions", {
          params: { visibility: "shared", page: householdExpensesPage, limit: 100 }
        })
      ).data,
    enabled: householdExpensesOpen
  });

  const personalExpenseTransactions = useQuery({
    queryKey: ["transactions", "private", "home-spending-table", monthRange],
    queryFn: async () =>
      (
        await api.get<TransactionListResponse>("/transactions", {
          params: { visibility: "private", type: "expense", page: 1, limit: 100, ...monthRange }
        })
      ).data,
    enabled: spendingExpensesOpen
  });

  const sharedExpenseTransactions = useQuery({
    queryKey: ["transactions", "shared", "home-spending-table", monthRange],
    queryFn: async () =>
      (
        await api.get<TransactionListResponse>("/transactions", {
          params: { visibility: "shared", page: 1, limit: 100, ...monthRange }
        })
      ).data,
    enabled: spendingExpensesOpen
  });

  const form = useForm<QuickForm>({
    resolver: zodResolver(quickSchema),
    defaultValues: { ...defaultQuickValues, paidBy: userName }
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema)
  });

  const editMutation = useMutation({
    mutationFn: async (values: EditForm) => {
      if (!editingTransaction) return;
      return (
        await api.put(`/transactions/${editingTransaction._id}`, {
          ...values,
          type: editingTransaction.type,
          visibility: editingTransaction.visibility,
          splitMode: editingTransaction.splitMode,
          splitType: editingTransaction.splitType,
          splitConfig: editingTransaction.splitConfig ?? {},
          isRecurring: editingTransaction.isRecurring,
          date: new Date(values.date).toISOString()
        })
      ).data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["partner-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["category-breakdown"] }),
        queryClient.invalidateQueries({ queryKey: ["income-vs-expense"] })
      ]);
      setEditingTransaction(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["partner-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["category-breakdown"] }),
        queryClient.invalidateQueries({ queryKey: ["income-vs-expense"] })
      ]);
      setEditingTransaction(null);
    }
  });

  const openEdit = (t: Transaction) => {
    const categoryId = typeof t.categoryId === "string" ? t.categoryId : (t.categoryId as Category)._id;
    editForm.reset({
      amount: t.amount,
      categoryId,
      date: dateInput(t.date),
      paidBy: t.paidBy,
      description: t.description ?? ""
    });
    setEditingTransaction(t);
  };

  const allCategories = categories.data ?? [];

  const quickType = form.watch("quickType");
  const isSharedExpense = quickType === "shared-expense";
  const transactionType = quickType === "private-income" ? "income" : "expense";
  const availableCategories =
    categories.data?.filter((category) => category.type === transactionType || category.type === "both") ?? [];

  const saveMutation = useMutation({
    mutationFn: async (values: QuickForm) => {
      const visibility = values.quickType === "shared-expense" ? "shared" : "private";
      return (
        await api.post("/transactions", {
          type: values.quickType === "private-income" ? "income" : "expense",
          amount: values.amount,
          categoryId: values.categoryId,
          description: values.description,
          date: new Date(values.date).toISOString(),
          paidBy: visibility === "private" ? userName : values.paidBy,
          visibility,
          splitMode: visibility === "private" ? "individual" : "shared",
          splitType: "equal",
          splitConfig: {},
          isRecurring: false
        })
      ).data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["partner-balance"] }),
        queryClient.invalidateQueries({ queryKey: ["category-breakdown"] }),
        queryClient.invalidateQueries({ queryKey: ["income-vs-expense"] })
      ]);
      setSheetOpen(false);
      form.reset({ ...defaultQuickValues, paidBy: userName });
    }
  });

  const householdTotal = householdSummary.data?.expense ?? 0;
  const myHousePart = partnerNames.length ? householdTotal / partnerNames.length : 0;
  const personalIncome = personalSummary.data?.income ?? 0;
  const personalOnlyExpense = Math.max((personalSummary.data?.expense ?? 0) - myHousePart, 0);
  const balanceReal = personalSummary.data?.balance ?? 0;
  const personalCategories = personalBreakdown.data ?? [];
  const topSharedCategories = sharedBreakdown.data ?? [];
  const spendingExpenseItems = useMemo(
    () =>
      [
        ...(personalExpenseTransactions.data?.items ?? []).map((transaction) => ({
          transaction,
          source: "Propio"
        })),
        ...(sharedExpenseTransactions.data?.items ?? []).map((transaction) => ({
          transaction,
          source: "Hogar"
        }))
      ].sort(
        (a, b) =>
          new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime()
      ),
    [personalExpenseTransactions.data?.items, sharedExpenseTransactions.data?.items]
  );
  const spendingExpenseTotal =
    (personalExpenseTransactions.data?.totals.expense ?? 0) + (sharedExpenseTransactions.data?.totals.expense ?? 0);
  const spendingExpenseCount =
    (personalExpenseTransactions.data?.totals.count ?? 0) + (sharedExpenseTransactions.data?.totals.count ?? 0);

  const error =
    personalSummary.error ??
    householdSummary.error ??
    personalBreakdown.error ??
    partnerBalance.error ??
    categories.error ??
    saveMutation.error ??
    editMutation.error ??
    deleteMutation.error;
  const loading =
    personalSummary.isLoading ||
    householdSummary.isLoading ||
    personalBreakdown.isLoading ||
    partnerBalance.isLoading;

  return (
    <div className="w-full text-white">
      {error ? <ErrorState label={getErrorMessage(error)} /> : null}
      {loading ? <LoadingState /> : null}

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-40 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/15"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Nuevo
      </button>

      <MonthlyCarousel
        miEconomia={{
          ingresos: personalIncome,
          gastosPropios: personalOnlyExpense,
          balance: balanceReal,
          categorias: personalCategories
        }}
        hogar={{
          gastoTotal: householdTotal,
          tuParte: myHousePart,
          personas: partnerNames.length || 1,
          partnerBalance: partnerBalance.data,
          categorias: topSharedCategories
        }}
        currency={currency}
        userName={userName}
        onViewSpendingExpenses={() => setSpendingExpensesOpen(true)}
        onViewHouseholdExpenses={() => {
          setHouseholdExpensesPage(1);
          setHouseholdExpensesOpen(true);
        }}
      />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Registrar movimiento">
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
            {[
              ["private-income", "Ingreso"],
              ["private-expense", "Gasto"],
              ["shared-expense", "Hogar"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  form.setValue("quickType", value as QuickType);
                  form.setValue("categoryId", "");
                  form.setValue("paidBy", value === "shared-expense" ? partnerNames[0] ?? userName : userName);
                }}
                className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${
                  quickType === value ? "bg-white text-brand shadow-sm" : "text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Field label="Importe" error={form.formState.errors.amount?.message}>
            <Input type="number" step="0.01" min="0" {...form.register("amount", { valueAsNumber: true })} />
          </Field>

          <Field label="Categoria" error={form.formState.errors.categoryId?.message}>
            <Select {...form.register("categoryId")}>
              <option value="">Seleccionar</option>
              {availableCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </Field>
            {isSharedExpense ? (
              <Field label="Pago" error={form.formState.errors.paidBy?.message}>
                <Select {...form.register("paidBy")}>
                  {partnerNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Persona">
                <Input value={userName} disabled />
              </Field>
            )}
          </div>

          <Field label="Descripcion" error={form.formState.errors.description?.message}>
            <Input placeholder="Opcional" {...form.register("description")} />
          </Field>

          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </Sheet>

      <Sheet open={spendingExpensesOpen} onClose={() => setSpendingExpensesOpen(false)} title="Control de gastos">
        <div className="grid gap-4 text-ink">
          {personalExpenseTransactions.error ? (
            <ErrorState label={getErrorMessage(personalExpenseTransactions.error)} />
          ) : null}
          {sharedExpenseTransactions.error ? (
            <ErrorState label={getErrorMessage(sharedExpenseTransactions.error)} />
          ) : null}
          {personalExpenseTransactions.isLoading || sharedExpenseTransactions.isLoading ? <LoadingState /> : null}

          {personalExpenseTransactions.data && sharedExpenseTransactions.data ? (
            <>
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Propios + hogar este mes</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <strong className="text-xl text-brand">{money(spendingExpenseTotal, currency)}</strong>
                  <span className="text-xs font-semibold text-muted">{spendingExpenseCount} gastos</span>
                </div>
              </div>

              {!spendingExpenseItems.length ? (
                <EmptyState label="Aun no hay gastos para el control mensual." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
                  <div className="grid grid-cols-[4.5rem_1fr_5.75rem_4.25rem] gap-2 border-b border-brand-100 bg-brand-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    <span>Fecha</span>
                    <span>Detalle</span>
                    <span className="text-right">Importe</span>
                    <span />
                  </div>
                  <div className="divide-y divide-brand-50">
                    {spendingExpenseItems.map(({ transaction, source }) => {
                      const category =
                        typeof transaction.categoryId === "string" ? null : transaction.categoryId;

                      return (
                        <div
                          key={`${source}-${transaction._id}`}
                          className="grid grid-cols-[4.5rem_1fr_5.75rem_4.25rem] gap-2 px-3 py-3 text-xs"
                        >
                          <span className="font-semibold text-muted">{shortDate(transaction.date)}</span>
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                  source === "Hogar" ? "bg-brand-50 text-brand" : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {source}
                              </span>
                              <p className="truncate font-semibold text-ink">{category?.name ?? "Sin categoria"}</p>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-muted">
                              {transaction.description ? `${transaction.description} · ` : ""}
                              Pago: {transaction.paidBy}
                            </p>
                          </div>
                          <strong className="text-right text-red-600">{money(transaction.amount, currency)}</strong>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(transaction)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-brand-50 hover:text-ink"
                              aria-label="Editar gasto"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(transaction._id)}
                              disabled={deleteMutation.isPending}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Eliminar gasto"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </Sheet>

      <Sheet open={householdExpensesOpen} onClose={() => setHouseholdExpensesOpen(false)} title="Gastos del hogar">
        <div className="grid gap-4 text-ink">
          {householdExpenses.error ? <ErrorState label={getErrorMessage(householdExpenses.error)} /> : null}
          {householdExpenses.isLoading ? <LoadingState /> : null}

          {householdExpenses.data ? (
            <>
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total compartido</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <strong className="text-xl text-brand">{money(householdExpenses.data.totals.expense, currency)}</strong>
                  <span className="text-xs font-semibold text-muted">
                    {householdExpenses.data.totals.count} gastos
                  </span>
                </div>
              </div>

              {!householdExpenses.data.items.length ? (
                <EmptyState label="Aun no hay gastos del hogar." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
                  <div className="grid grid-cols-[4.5rem_1fr_5.75rem_4.25rem] gap-2 border-b border-brand-100 bg-brand-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    <span>Fecha</span>
                    <span>Detalle</span>
                    <span className="text-right">Importe</span>
                    <span />
                  </div>
                  <div className="divide-y divide-brand-50">
                    {householdExpenses.data.items.map((transaction) => {
                      const category =
                        typeof transaction.categoryId === "string" ? null : transaction.categoryId;

                      return (
                        <div
                          key={transaction._id}
                          className="grid grid-cols-[4.5rem_1fr_5.75rem_4.25rem] gap-2 px-3 py-3 text-xs"
                        >
                          <span className="font-semibold text-muted">{shortDate(transaction.date)}</span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{category?.name ?? "Sin categoria"}</p>
                            <p className="mt-0.5 truncate text-[11px] text-muted">
                              {transaction.description ? `${transaction.description} · ` : ""}
                              Pago: {transaction.paidBy}
                            </p>
                          </div>
                          <strong className="text-right text-red-600">{money(transaction.amount, currency)}</strong>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(transaction)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-brand-50 hover:text-ink"
                              aria-label="Editar gasto"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(transaction._id)}
                              disabled={deleteMutation.isPending}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Eliminar gasto"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {householdExpenses.data.pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between text-sm text-muted">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={householdExpensesPage <= 1}
                    onClick={() => setHouseholdExpensesPage((page) => page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="font-medium text-ink">
                    {householdExpensesPage} / {householdExpenses.data.pagination.totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={householdExpensesPage >= householdExpenses.data.pagination.totalPages}
                    onClick={() => setHouseholdExpensesPage((page) => page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </Sheet>

      <Sheet open={!!editingTransaction} onClose={() => setEditingTransaction(null)} title="Editar gasto">
        <form className="grid gap-4" onSubmit={editForm.handleSubmit((v) => editMutation.mutate(v))}>
          <Field label="Importe" error={editForm.formState.errors.amount?.message}>
            <Input type="number" step="0.01" min="0" {...editForm.register("amount", { valueAsNumber: true })} />
          </Field>
          <Field label="Categoria" error={editForm.formState.errors.categoryId?.message}>
            <Select {...editForm.register("categoryId")}>
              <option value="">Seleccionar</option>
              {allCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha" error={editForm.formState.errors.date?.message}>
            <Input type="date" {...editForm.register("date")} />
          </Field>
          <Field label="Pagado por" error={editForm.formState.errors.paidBy?.message}>
            <Select {...editForm.register("paidBy")}>
              <option value="">Seleccionar</option>
              {partnerNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
          <Field label="Descripcion" error={editForm.formState.errors.description?.message}>
            <Input placeholder="Opcional" {...editForm.register("description")} />
          </Field>
          {editMutation.error ? <ErrorState label={getErrorMessage(editMutation.error)} /> : null}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={editMutation.isPending} className="flex-1">
              {editMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditingTransaction(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
};
