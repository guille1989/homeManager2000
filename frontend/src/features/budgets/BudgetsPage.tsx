import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/State";
import { api, getErrorMessage } from "../../lib/api";
import type { Budget, Category, Visibility } from "../../types";
import { currentMonthYear, money } from "../../utils/format";
import { useAuth } from "../auth/AuthProvider";

const now = currentMonthYear();

const schema = z.object({
  categoryId: z.string().min(1, "Selecciona una categoría"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  limit: z.coerce.number().nonnegative("Debe ser 0 o mayor"),
  visibility: z.enum(["private", "shared"])
});

type BudgetForm = z.infer<typeof schema>;

const defaults: BudgetForm = {
  categoryId: "",
  month: now.month,
  year: now.year,
  limit: 0,
  visibility: "shared"
};

const statusClass = (percentage: number) => {
  if (percentage >= 100) return "bg-red-600";
  if (percentage >= 80) return "bg-amber-500";
  return "bg-mint";
};

export const BudgetsPage = ({ visibility = "shared" }: { visibility?: Visibility }) => {
  const { household } = useAuth();
  const isPrivate = visibility === "private";
  const currency = household?.currency ?? "EUR";
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState(now);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data
  });

  const budgets = useQuery({
    queryKey: ["budgets", visibility, period],
    queryFn: async () => (await api.get<Budget[]>("/budgets", { params: { ...period, visibility } })).data
  });

  const expenseCategories =
    categories.data?.filter((category) => category.type === "expense" || category.type === "both") ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BudgetForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BudgetForm) => {
      const payload = { ...values, visibility };
      if (editingId) return (await api.put(`/budgets/${editingId}`, payload)).data;
      return (await api.post("/budgets", payload)).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setEditingId(null);
      reset({ ...defaults, visibility, month: period.month, year: period.year });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["budgets"] })
  });

  const pageError = categories.error ?? budgets.error ?? saveMutation.error ?? deleteMutation.error;

  return (
    <div className="grid gap-3 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{isPrivate ? "Mis Presupuestos" : "Presupuestos Compartidos"}</h2>
          <p className="text-sm text-muted">{isPrivate ? "Control mensual privado por categoría." : "Control mensual compartido por categoría."}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={1}
            max={12}
            value={period.month}
            onChange={(event) => setPeriod({ ...period, month: Number(event.target.value) })}
          />
          <Input
            type="number"
            min={2000}
            value={period.year}
            onChange={(event) => setPeriod({ ...period, year: Number(event.target.value) })}
          />
        </div>
      </div>

      {pageError ? <ErrorState label={getErrorMessage(pageError)} /> : null}

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[1fr_120px_140px_160px_auto] md:gap-4" onSubmit={handleSubmit((values) => saveMutation.mutate(values))}>
          <Field label="Categoría" error={errors.categoryId?.message}>
            <Select {...register("categoryId")}>
              <option value="">Seleccionar</option>
              {expenseCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mes" error={errors.month?.message}>
            <Input type="number" min={1} max={12} {...register("month", { valueAsNumber: true })} />
          </Field>
          <Field label="Año" error={errors.year?.message}>
            <Input type="number" min={2000} {...register("year", { valueAsNumber: true })} />
          </Field>
          <Field label="Límite" error={errors.limit?.message}>
            <Input type="number" step="0.01" {...register("limit", { valueAsNumber: true })} />
          </Field>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editingId ? "Guardar" : "Crear"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  reset({ ...defaults, visibility, month: period.month, year: period.year });
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-2 sm:p-4">
        {budgets.isLoading ? <LoadingState /> : null}
        {!budgets.isLoading && !budgets.data?.length ? (
          <EmptyState label="No hay presupuestos para este mes." />
        ) : null}
        {budgets.data?.length ? (
          <div className="grid gap-2 sm:gap-4">
            {budgets.data.map((budget) => (
              <div key={budget._id} className="rounded-lg border border-brand-100 bg-white/80 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <strong className="text-sm sm:text-base">{budget.categoryId.name}</strong>
                    <p className="text-xs text-muted sm:text-sm">
                      {money(budget.spent, currency)} de {money(budget.limit, currency)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 sm:gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                      onClick={() => {
                        setEditingId(budget._id);
                        reset({
                          categoryId: budget.categoryId._id,
                          month: budget.month,
                          year: budget.year,
                          limit: budget.limit,
                          visibility
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                      onClick={() => deleteMutation.mutate(budget._id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100 sm:mt-3 sm:h-3">
                  <div
                    className={`h-full rounded-full ${statusClass(budget.percentage)}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-muted sm:mt-2 sm:text-sm">{budget.percentage}% consumido</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
};
