import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { ErrorState } from "../../components/ui/State";
import { getErrorMessage } from "../../lib/api";
import { useAuth } from "./AuthProvider";

const schema = z
  .object({
    mode: z.enum(["create", "join"]),
    name: z.string().min(2, "Minimo 2 caracteres"),
    partnerName: z.string().optional(),
    householdName: z.string().optional(),
    inviteCode: z.string().optional(),
    currency: z.string().length(3, "Usa un codigo ISO de 3 letras"),
    email: z.string().email("Email invalido"),
    password: z.string().min(8, "Minimo 8 caracteres")
  })
  .superRefine((value, ctx) => {
    if (value.mode === "create") {
      if (!value.partnerName || value.partnerName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["partnerName"],
          message: "Minimo 2 caracteres"
        });
      }
      if (!value.householdName || value.householdName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["householdName"],
          message: "Minimo 2 caracteres"
        });
      }
    }

    if (value.mode === "join" && (!value.inviteCode || value.inviteCode.trim().length < 8)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inviteCode"],
        message: "Introduce el codigo de invitacion"
      });
    }
  });

type RegisterForm = z.infer<typeof schema>;

export const RegisterPage = () => {
  const { register: createAccount, token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: "create",
      name: "",
      partnerName: "",
      householdName: "Mi hogar",
      inviteCode: "",
      currency: "EUR",
      email: "",
      password: ""
    }
  });

  if (token) {
    return <Navigate to="/" replace />;
  }

  const mode = watch("mode");

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await createAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        currency: values.currency.toUpperCase(),
        ...(values.mode === "join"
          ? { inviteCode: values.inviteCode?.trim() }
          : { householdName: values.householdName, partnerName: values.partnerName })
      });
      navigate("/");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  });

  return (
    <main className="flex min-h-screen">
      <div
        className="relative hidden flex-col items-center justify-center overflow-hidden lg:flex lg:w-2/5"
        style={{ background: "linear-gradient(135deg, #1f293d 0%, #353d54 50%, #448481 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/img/InnoApp - Post 2 - 1080x1080.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6 px-10 text-center">
          <img src="/img/InnoApp - Logotipo - vector.svg" alt="InnoApp" className="w-64 object-contain" />
          <p className="max-w-xs text-base font-medium leading-relaxed text-brand-200">
            Crea tu hogar o unete con una invitacion para gestionar vuestras finanzas juntos
          </p>
        </div>
      </div>

      <div className="flex w-full items-start justify-center overflow-y-auto bg-white px-6 py-10 lg:w-3/5">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Nuevo acceso</p>
          <h1 className="mb-8 mt-2 text-3xl font-bold text-ink">Crear cuenta</h1>

          {error ? <ErrorState label={error} /> : null}

          <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 sm:col-span-2">
              <button
                type="button"
                onClick={() => setValue("mode", "create")}
                className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${
                  mode === "create" ? "bg-white text-brand shadow-sm" : "text-muted"
                }`}
              >
                Crear hogar
              </button>
              <button
                type="button"
                onClick={() => setValue("mode", "join")}
                className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${
                  mode === "join" ? "bg-white text-brand shadow-sm" : "text-muted"
                }`}
              >
                Unirme con codigo
              </button>
            </div>

            <Field label="Tu nombre" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>

            {mode === "create" ? (
              <Field label="Nombre de tu pareja" error={errors.partnerName?.message}>
                <Input {...register("partnerName")} />
              </Field>
            ) : (
              <Field label="Codigo de invitacion" error={errors.inviteCode?.message}>
                <Input {...register("inviteCode")} />
              </Field>
            )}

            {mode === "create" ? (
              <Field label="Nombre del hogar" error={errors.householdName?.message}>
                <Input {...register("householdName")} />
              </Field>
            ) : null}

            <Field label="Moneda" error={errors.currency?.message}>
              <Input className="uppercase" maxLength={3} {...register("currency")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Contrasena" error={errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...register("password")} />
            </Field>
            <Button className="mt-1 sm:col-span-2" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : mode === "join" ? "Crear y unirme" : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            Ya tienes cuenta?{" "}
            <Link className="font-semibold text-brand hover:text-brand-700" to="/login">
              Iniciar sesion
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
