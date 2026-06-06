import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { Sheet } from "../../components/ui/Sheet";
import { ChevronDownIcon, ChevronUpIcon, EditIcon, FilterIcon, PlusIcon, TrashIcon, TrendDownIcon, TrendUpIcon } from "../../components/ui/Icons";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/State";
import { api, getErrorMessage } from "../../lib/api";
import type { Category, Transaction, TransactionType, Visibility } from "../../types";
import { dateInput, money, shortDate } from "../../utils/format";
import { useAuth } from "../auth/AuthProvider";

type TransactionListResponse = {
  items: Transaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totals: { count: number; income: number; expense: number; balance: number };
};

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().max(200),
  date: z.string().min(1, "Selecciona una fecha"),
  paidBy: z.string().min(1, "Selecciona una persona"),
  splitMode: z.enum(["individual", "shared"]),
  splitType: z.enum(["equal", "percentage", "custom"]),
  splitA: z.coerce.number().nonnegative().optional(),
  splitB: z.coerce.number().nonnegative().optional(),
  isRecurring: z.boolean(),
});

type TransactionForm = z.infer<typeof schema>;

type Filters = {
  type: "" | TransactionType;
  categoryId: string;
  paidBy: string;
  startDate: string;
  endDate: string;
};

const defaultValues: TransactionForm = {
  type: "expense",
  amount: 0,
  categoryId: "",
  description: "",
  date: dateInput(new Date()),
  paidBy: "",
  splitMode: "shared",
  splitType: "equal",
  splitA: 50,
  splitB: 50,
  isRecurring: false,
};

const emptyFilters: Filters = { type: "", categoryId: "", paidBy: "", startDate: "", endDate: "" };

// ── Transaction card ──────────────────────────────────────────────────────────
const TransactionCard = ({
  transaction,
  currency,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  currency: string;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}) => {
  const category =
    typeof transaction.categoryId === "string" ? null : (transaction.categoryId as Category);
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-2 border-b border-brand-50 py-2.5 last:border-0 sm:gap-3 sm:py-3.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 sm:text-sm"
        style={{
          background: category?.color ? `${category.color}25` : "#c5efec40",
          color: category?.color ?? "#448481",
        }}
      >
        {category?.name?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-ink sm:text-sm">
            {category?.name ?? "Sin categoría"}
          </span>
          <span
            className={`shrink-0 text-[13px] font-bold sm:text-sm ${isIncome ? "text-emerald-600" : "text-red-600"}`}
          >
            {isIncome ? "+" : "-"}
            {money(transaction.amount, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-muted sm:text-xs">
            {[transaction.description || null, transaction.paidBy, shortDate(transaction.date)]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <div className="flex shrink-0 gap-0.5">
            <button
              onClick={() => onEdit(transaction)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-brand-50 hover:text-ink sm:h-7 sm:w-7"
            >
              <EditIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(transaction._id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-red-50 hover:text-red-500 sm:h-7 sm:w-7"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const TransactionsPage = ({ visibility = "shared" }: { visibility?: Visibility }) => {
  const { household, user } = useAuth();
  const isPrivate = visibility === "private";
  const currency = household?.currency ?? "EUR";
  const partnerNames = isPrivate ? [user?.name ?? "Yo"] : household?.partnerNames ?? [];
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  });

  const queryParams = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    [filters]
  );

  const transactions = useQuery({
    queryKey: ["transactions", visibility, { ...queryParams, page, limit: 20 }],
    queryFn: async () =>
      (
        await api.get<TransactionListResponse>("/transactions", {
          params: { ...queryParams, visibility, page, limit: 20 },
        })
      ).data,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<TransactionForm>({
      resolver: zodResolver(schema),
      defaultValues: { ...defaultValues, paidBy: partnerNames[0] ?? "" },
    });

  const selectedType = watch("type");
  const effectiveType = isPrivate ? selectedType : "expense";
  const availableCategories =
    categories.data?.filter(
      (c) => c.type === effectiveType || c.type === "both"
    ) ?? [];

  const saveMutation = useMutation({
    mutationFn: async (values: TransactionForm) => {
      const splitConfig =
        isPrivate && values.splitType !== "equal" && partnerNames.length >= 2
          ? { shares: { [partnerNames[0]]: values.splitA ?? 0, [partnerNames[1]]: values.splitB ?? 0 } }
          : {};
      const payload = {
        ...values,
        type: isPrivate ? values.type : "expense",
        visibility,
        splitMode: isPrivate ? "individual" : "shared",
        splitType: isPrivate ? values.splitType : "equal",
        splitConfig,
        date: new Date(values.date).toISOString()
      };
      if (editingId) return (await api.put(`/transactions/${editingId}`, payload)).data;
      return (await api.post("/transactions", payload)).data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["category-breakdown"] }),
        queryClient.invalidateQueries({ queryKey: ["income-vs-expense"] }),
        queryClient.invalidateQueries({ queryKey: ["partner-balance"] }),
      ]);
      closeSheet();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const openNew = () => {
    setEditingId(null);
    reset({ ...defaultValues, splitMode: isPrivate ? "individual" : "shared", paidBy: partnerNames[0] ?? "" });
    setShowAdvanced(false);
    setSheetOpen(true);
  };

  const openEdit = (t: Transaction) => {
    const category = t.categoryId as Category;
    setEditingId(t._id);
    reset({
      type: t.type,
      amount: t.amount,
      categoryId: typeof t.categoryId === "string" ? t.categoryId : category._id,
      description: t.description,
      date: dateInput(t.date),
      paidBy: t.paidBy,
      splitMode: t.splitMode,
      splitType: t.splitType ?? "equal",
      splitA: t.splitConfig?.shares?.[partnerNames[0]] ?? 50,
      splitB: t.splitConfig?.shares?.[partnerNames[1]] ?? 50,
      isRecurring: t.isRecurring,
    });
    setShowAdvanced(!!(t.description || t.isRecurring));
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingId(null);
    reset({ ...defaultValues, splitMode: isPrivate ? "individual" : "shared", paidBy: partnerNames[0] ?? "" });
    setShowAdvanced(false);
  };

  const updateFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const clearFilters = () => updateFilters(emptyFilters);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    const pagination = transactions.data?.pagination;
    if (pagination && page > pagination.totalPages && pagination.totalPages > 0) {
      setPage(pagination.totalPages);
    }
  }, [page, transactions.data?.pagination]);

  const items = transactions.data?.items ?? [];
  const pagination = transactions.data?.pagination;
  const totals = transactions.data?.totals;
  const pageError =
    categories.error ?? transactions.error ?? saveMutation.error ?? deleteMutation.error;

  return (
    <div className="grid gap-3 sm:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{isPrivate ? "Mis Movimientos" : "Gastos Compartidos"}</h2>
          <p className="text-sm text-muted">{isPrivate ? "Ingresos y gastos personales privados." : "Solo gastos compartidos del hogar."}</p>
        </div>
        <Button onClick={openNew} className="hidden items-center gap-2 sm:flex">
          <PlusIcon className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {pageError ? <ErrorState label={getErrorMessage(pageError)} /> : null}

      {/* Totals strip */}
      {totals && isPrivate ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 sm:rounded-xl sm:p-3">
            <p className="text-xs font-medium text-emerald-700">Ingresos</p>
            <p className="mt-0.5 truncate text-sm font-bold text-emerald-700 sm:text-base">
              {money(totals.income, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 sm:rounded-xl sm:p-3">
            <p className="text-xs font-medium text-red-700">Gastos</p>
            <p className="mt-0.5 truncate text-sm font-bold text-red-700 sm:text-base">
              {money(totals.expense, currency)}
            </p>
          </div>
          <div
            className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${totals.balance >= 0 ? "bg-brand-50" : "bg-red-50"}`}
          >
            <p
              className={`text-xs font-medium ${totals.balance >= 0 ? "text-brand" : "text-red-700"}`}
            >
              Balance
            </p>
            <p
              className={`mt-0.5 truncate text-sm font-bold sm:text-base ${totals.balance >= 0 ? "text-brand" : "text-red-700"}`}
            >
              {money(totals.balance, currency)}
            </p>
          </div>
        </div>
      ) : null}
      {totals && !isPrivate ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg bg-red-50 p-2 sm:rounded-xl sm:p-3">
            <p className="text-xs font-medium text-red-700">Gastos compartidos</p>
            <p className="mt-0.5 truncate text-sm font-bold text-red-700 sm:text-base">
              {money(totals.expense, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-brand-50 p-2 sm:rounded-xl sm:p-3">
            <p className="text-xs font-medium text-brand">Movimientos</p>
            <p className="mt-0.5 truncate text-sm font-bold text-brand sm:text-base">
              {totals.count}
            </p>
          </div>
        </div>
      ) : null}

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            filtersOpen || activeFilterCount > 0
              ? "border-brand bg-brand-50 text-brand"
              : "border-brand-100 bg-white text-muted hover:border-brand hover:text-ink"
          }`}
        >
          <FilterIcon className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
          {filtersOpen ? (
            <ChevronUpIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-muted hover:text-danger transition"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="grid gap-2 rounded-lg border border-brand-100 bg-white p-3 sm:grid-cols-2 sm:gap-3 sm:rounded-xl sm:p-4 lg:grid-cols-5">
          {isPrivate ? (
            <Select
              value={filters.type}
              onChange={(e) => updateFilters({ ...filters, type: e.target.value as never })}
            >
              <option value="">Todos los tipos</option>
              <option value="expense">Gastos</option>
              <option value="income">Ingresos</option>
            </Select>
          ) : null}
          <Select
            value={filters.categoryId}
            onChange={(e) => updateFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">Todas las categorías</option>
            {categories.data?.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
          <Select
            value={filters.paidBy}
            onChange={(e) => updateFilters({ ...filters, paidBy: e.target.value })}
          >
            <option value="">Todas las personas</option>
            {partnerNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      )}

      {/* Transaction list */}
      <div className="rounded-lg border border-brand-100 bg-white px-2 sm:rounded-xl sm:px-4">
        {transactions.isLoading ? <div className="py-8"><LoadingState /></div> : null}
        {!transactions.isLoading && !items.length ? (
          <div className="py-8">
            <EmptyState label="No hay movimientos con esos filtros." />
          </div>
        ) : null}
        {items.map((t) => (
          <TransactionCard
            key={t._id}
            transaction={t}
            currency={currency}
            onEdit={openEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="font-medium text-ink">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      ) : null}

      {/* FAB — mobile only */}
      <button
        onClick={openNew}
        className="fixed bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-brand shadow-lg transition hover:bg-brand-700 lg:hidden"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Sheet — add / edit form */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editingId ? "Editar movimiento" : "Nuevo movimiento"}
      >
        <form className="grid gap-4" onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
          {/* Type toggle */}
          {isPrivate ? (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                selectedType === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-muted"
              }`}
              onClick={() => { setValue("type", "expense"); setValue("categoryId", ""); }}
            >
              <TrendDownIcon className="h-4 w-4" />
              Gasto
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                selectedType === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-muted"
              }`}
              onClick={() => { setValue("type", "income"); setValue("categoryId", ""); }}
            >
              <TrendUpIcon className="h-4 w-4" />
              Ingreso
            </button>
          </div>
          ) : null}

          {/* Amount */}
          <Field label="Importe" error={errors.amount?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-muted">
                {currency}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-14 pl-14 text-xl font-bold"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
          </Field>

          {/* Category */}
          <Field label="Categoría" error={errors.categoryId?.message}>
            <Select {...register("categoryId")}>
              <option value="">Seleccionar categoría</option>
              {availableCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>

          {/* Date */}
          <Field label="Fecha" error={errors.date?.message}>
            <Input type="date" {...register("date")} />
          </Field>

          {/* Paid by */}
          <Field label="Pagado por" error={errors.paidBy?.message}>
            <Select {...register("paidBy")}>
              <option value="">Seleccionar persona</option>
              {partnerNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>

          {/* Advanced options toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
          >
            {showAdvanced ? (
              <ChevronUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            )}
            {showAdvanced ? "Menos opciones" : "Más opciones"}
          </button>

          {showAdvanced && (
            <div className="grid gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
              <Field label="Descripción" error={errors.description?.message}>
                <Input placeholder="Opcional" {...register("description")} />
              </Field>
              {!isPrivate ? (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-muted">
                  Este gasto queda registrado como pagado por una sola persona; el balance entre miembros lo reparte 50/50.
                </p>
              ) : null}
              <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-brand-200 accent-brand"
                  {...register("isRecurring")}
                />
                Se repite mensualmente
              </label>
            </div>
          )}

          {saveMutation.error ? (
            <ErrorState label={getErrorMessage(saveMutation.error)} />
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
              {saveMutation.isPending
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Crear movimiento"}
            </Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={closeSheet}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Sheet>
    </div>
  );
};
