import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";
import { ErrorState } from "../../components/ui/State";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../auth/AuthProvider";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  currency: z.string().length(3, "Usa 3 letras"),
  partnerOne: z.string().min(2, "Mínimo 2 caracteres"),
  partnerTwo: z.string().min(2, "Mínimo 2 caracteres")
});

type SettingsForm = z.infer<typeof schema>;

export const SettingsPage = () => {
  const { household, refreshMe, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      currency: "EUR",
      partnerOne: "",
      partnerTwo: ""
    }
  });

  useEffect(() => {
    if (household) {
      reset({
        name: household.name,
        currency: household.currency,
        partnerOne: household.partnerNames[0] ?? "",
        partnerTwo: household.partnerNames[1] ?? ""
      });
    }
  }, [household, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsForm) => {
      if (!household) throw new Error("No household loaded");
      return (
        await api.put(`/households/${household._id}`, {
          name: values.name,
          currency: values.currency.toUpperCase(),
          partnerNames: [values.partnerOne, values.partnerTwo]
        })
      ).data;
    },
    onSuccess: async () => {
      await refreshMe();
      await queryClient.invalidateQueries();
    }
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!household) throw new Error("No household loaded");
      return (await api.delete(`/households/${household._id}/data`)).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!household) throw new Error("No household loaded");
      return (await api.post<{ inviteCode: string }>(`/households/${household._id}/invite`)).data;
    },
    onSuccess: (data) => {
      setInviteCode(data.inviteCode);
    }
  });

  const error = updateMutation.error ?? clearMutation.error ?? inviteMutation.error;

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-ink">Configuración</h2>
        <p className="text-sm text-muted">Ajustes del hogar y sesión.</p>
      </div>

      {error ? <ErrorState label={getErrorMessage(error)} /> : null}

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
          <Field label="Nombre del hogar" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Moneda" error={errors.currency?.message}>
            <Input maxLength={3} className="uppercase" {...register("currency")} />
          </Field>
          <Field label="Persona 1" error={errors.partnerOne?.message}>
            <Input {...register("partnerOne")} />
          </Field>
          <Field label="Persona 2" error={errors.partnerTwo?.message}>
            <Input {...register("partnerTwo")} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={updateMutation.isPending}>
              Guardar configuración
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h3 className="text-lg font-bold text-ink">Invitar a la segunda persona</h3>
            <p className="text-sm text-muted">
              Genera un codigo para que cree su cuenta y entre en este mismo hogar.
            </p>
            {inviteCode ? (
              <div className="mt-3 inline-flex rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 font-mono text-sm font-bold text-brand">
                {inviteCode}
              </div>
            ) : null}
          </div>
          <Button type="button" variant="secondary" disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
            {inviteMutation.isPending ? "Generando..." : "Generar codigo"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h3 className="text-lg font-bold text-ink">Datos del hogar</h3>
            <p className="text-sm text-muted">
              Limpia movimientos, presupuestos, metas, aportaciones y recurrencias. Las categorías se mantienen.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            disabled={clearMutation.isPending}
            onClick={() => {
              if (window.confirm("¿Seguro que quieres limpiar los datos del hogar?")) {
                clearMutation.mutate();
              }
            }}
          >
            Limpiar datos
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h3 className="text-lg font-bold text-ink">Sesión</h3>
            <p className="text-sm text-muted">Cierra la sesión en este navegador.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
};
