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
import type { Category } from "../../types";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  type: z.enum(["income", "expense", "both"]),
  color: z.string().regex(/^#([a-f\d]{3}|[a-f\d]{6})$/i, "Color hexadecimal inválido")
});

type CategoryForm = z.infer<typeof schema>;

const defaults: CategoryForm = {
  name: "",
  type: "expense",
  color: "#448481"
};

export const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryForm) => {
      if (editingId) {
        return (await api.put(`/categories/${editingId}`, values)).data;
      }
      return (await api.post("/categories", values)).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      reset(defaults);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const onSubmit = handleSubmit((values) => saveMutation.mutate(values));
  const pageError = categories.error ?? saveMutation.error ?? deleteMutation.error;

  return (
    <div className="grid gap-3 sm:gap-5">
      <div>
        <h2 className="text-xl font-bold text-ink sm:text-2xl">Categorías</h2>
        <p className="text-sm text-muted">Organiza ingresos y gastos del hogar.</p>
      </div>

      {pageError ? <ErrorState label={getErrorMessage(pageError)} /> : null}

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_140px_auto] md:gap-4" onSubmit={onSubmit}>
          <Field label="Nombre" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Tipo" error={errors.type?.message}>
            <Select {...register("type")}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
              <option value="both">Ambos</option>
            </Select>
          </Field>
          <Field label="Color" error={errors.color?.message}>
            <Input type="color" {...register("color")} />
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
                  reset(defaults);
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-2 sm:p-4">
        {categories.isLoading ? <LoadingState /> : null}
        {!categories.isLoading && !categories.data?.length ? (
          <EmptyState label="No hay categorías todavía." />
        ) : null}

        {categories.data?.length ? (
          <div className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.data.map((category) => (
              <div key={category._id} className="rounded-lg border border-brand-100 bg-white/80 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
                      <strong className="text-sm sm:text-base">{category.name}</strong>
                    </div>
                    <p className="mt-1 text-xs text-muted sm:text-sm">
                      {category.type === "both"
                        ? "Ingresos y gastos"
                        : category.type === "income"
                          ? "Ingresos"
                          : "Gastos"}
                    </p>
                  </div>
                  {category.isDefault ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand sm:py-1 sm:text-xs">
                      Inicial
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex gap-1 sm:mt-4 sm:gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    onClick={() => {
                      setEditingId(category._id);
                      reset({ name: category.name, type: category.type, color: category.color });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
                    onClick={() => deleteMutation.mutate(category._id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

