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
import type { SavingsGoal, Visibility } from "../../types";
import { dateInput, money, shortDate } from "../../utils/format";
import { useAuth } from "../auth/AuthProvider";

const goalSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  targetAmount: z.coerce.number().positive("Debe ser mayor que 0"),
  currentAmount: z.coerce.number().nonnegative("Debe ser 0 o mayor"),
  targetDate: z.string().min(1, "Selecciona una fecha"),
  color: z.string().regex(/^#([a-f\d]{3}|[a-f\d]{6})$/i, "Color invalido"),
  visibility: z.enum(["private", "shared"]),
  type: z.enum(["personal", "shared"])
});

const contributionSchema = z.object({
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  date: z.string().min(1, "Selecciona una fecha"),
  contributedBy: z.string().min(1, "Selecciona una persona"),
  note: z.string().max(160).optional()
});

type GoalForm = z.infer<typeof goalSchema>;
type ContributionForm = z.infer<typeof contributionSchema>;

const goalDefaults: GoalForm = {
  name: "",
  targetAmount: 0,
  currentAmount: 0,
  targetDate: dateInput(new Date()),
  color: "#59b2b0",
  visibility: "shared",
  type: "shared"
};

export const SavingsGoalsPage = ({ visibility = "shared" }: { visibility?: Visibility }) => {
  const { household } = useAuth();
  const isPrivate = visibility === "private";
  const currency = household?.currency ?? "EUR";
  const partnerNames = household?.partnerNames ?? [];
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);

  const goals = useQuery({
    queryKey: ["savings-goals", visibility],
    queryFn: async () => (await api.get<SavingsGoal[]>("/savings-goals", { params: { visibility } })).data
  });

  const goalForm = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: goalDefaults
  });

  const contributionForm = useForm<ContributionForm>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: 0,
      date: dateInput(new Date()),
      contributedBy: partnerNames[0] ?? "",
      note: ""
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: GoalForm) => {
      const payload = {
        ...values,
        visibility,
        type: isPrivate ? "personal" : "shared",
        targetDate: new Date(values.targetDate).toISOString()
      };
      if (editingId) return (await api.put(`/savings-goals/${editingId}`, payload)).data;
      return (await api.post("/savings-goals", payload)).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
      setEditingId(null);
      goalForm.reset({ ...goalDefaults, visibility, type: isPrivate ? "personal" : "shared" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/savings-goals/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
    }
  });

  const contributionMutation = useMutation({
    mutationFn: async (values: ContributionForm) =>
      (
        await api.post(`/savings-goals/${contributionGoalId}/contributions`, {
          ...values,
          date: new Date(values.date).toISOString()
        })
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
      setContributionGoalId(null);
      contributionForm.reset({
        amount: 0,
        date: dateInput(new Date()),
        contributedBy: partnerNames[0] ?? "",
        note: ""
      });
    }
  });

  const pageError = goals.error ?? saveMutation.error ?? deleteMutation.error ?? contributionMutation.error;

  return (
    <div className="grid gap-3 sm:gap-5">
      <div>
        <h2 className="text-xl font-bold text-ink sm:text-2xl">{isPrivate ? "Mis Metas" : "Metas Compartidas"}</h2>
        <p className="text-sm text-muted">{isPrivate ? "Objetivos personales privados." : "Objetivos compartidos del hogar."}</p>
      </div>

      {pageError ? <ErrorState label={getErrorMessage(pageError)} /> : null}

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_120px_auto] lg:gap-4" onSubmit={goalForm.handleSubmit((values) => saveMutation.mutate(values))}>
          <Field label="Meta" error={goalForm.formState.errors.name?.message}>
            <Input {...goalForm.register("name")} />
          </Field>
          <Field label="Objetivo" error={goalForm.formState.errors.targetAmount?.message}>
            <Input type="number" step="0.01" {...goalForm.register("targetAmount", { valueAsNumber: true })} />
          </Field>
          <Field label="Actual" error={goalForm.formState.errors.currentAmount?.message}>
            <Input type="number" step="0.01" {...goalForm.register("currentAmount", { valueAsNumber: true })} />
          </Field>
          <Field label="Fecha límite" error={goalForm.formState.errors.targetDate?.message}>
            <Input type="date" {...goalForm.register("targetDate")} />
          </Field>
          <Field label="Color" error={goalForm.formState.errors.color?.message}>
            <Input type="color" {...goalForm.register("color")} />
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
                  goalForm.reset({ ...goalDefaults, visibility, type: isPrivate ? "personal" : "shared" });
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-2 sm:p-4">
        {goals.isLoading ? <LoadingState /> : null}
        {!goals.isLoading && !goals.data?.length ? <EmptyState label="No hay metas creadas." /> : null}
        {goals.data?.length ? (
          <div className="grid gap-2 sm:gap-4 xl:grid-cols-2">
            {goals.data.map((goal) => (
              <div key={goal._id} className="rounded-lg border border-brand-100 bg-white/80 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: goal.color }} />
                      <strong className="text-sm sm:text-base">{goal.name}</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted sm:text-sm">Límite: {shortDate(goal.targetDate)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1 sm:gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                      onClick={() => {
                        setEditingId(goal._id);
                        goalForm.reset({
                          name: goal.name,
                          targetAmount: goal.targetAmount,
                          currentAmount: goal.currentAmount,
                          targetDate: dateInput(goal.targetDate),
                          color: goal.color,
                          visibility,
                          type: isPrivate ? "personal" : "shared"
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                      onClick={() => deleteMutation.mutate(goal._id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] sm:mt-4 sm:text-sm">
                  <span>
                    Actual <strong>{money(goal.currentAmount, currency)}</strong>
                  </span>
                  <span>
                    Falta <strong>{money(goal.remaining, currency)}</strong>
                  </span>
                  <span>
                    Necesario/mes <strong>{money(goal.monthlyRequired, currency)}</strong>
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100 sm:mt-3 sm:h-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${goal.percentage}%`, background: goal.color }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-muted sm:mt-2 sm:text-sm">{goal.percentage}% completado</p>

                {contributionGoalId === goal._id ? (
                  <form
                    className="mt-3 grid gap-2 rounded-md bg-brand-50 p-2 sm:mt-4 sm:grid-cols-4 sm:gap-3 sm:p-3"
                    onSubmit={contributionForm.handleSubmit((values) => contributionMutation.mutate(values))}
                  >
                    <Field label="Importe" error={contributionForm.formState.errors.amount?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        {...contributionForm.register("amount", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field label="Fecha" error={contributionForm.formState.errors.date?.message}>
                      <Input type="date" {...contributionForm.register("date")} />
                    </Field>
                    <Field label="Persona" error={contributionForm.formState.errors.contributedBy?.message}>
                      <Select {...contributionForm.register("contributedBy")}>
                        {partnerNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <div className="flex items-end gap-2">
                      <Button type="submit" disabled={contributionMutation.isPending}>
                        Aportar
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setContributionGoalId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button className="mt-3 px-3 py-2 text-xs sm:mt-4 sm:text-sm" type="button" variant="secondary" onClick={() => setContributionGoalId(goal._id)}>
                    Registrar aportación
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
};


