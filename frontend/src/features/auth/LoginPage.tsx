import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { ErrorState } from "../../components/ui/State";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { getErrorMessage } from "../../lib/api";
import { useAuth } from "./AuthProvider";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Introduce tu contraseña")
});

type LoginForm = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  });

  return (
    <main className="flex min-h-dvh">
      {/* Brand panel */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1f293d 0%, #353d54 50%, #448481 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/img/InnoApp - Post 1 - 1080x1080.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-12 gap-8">
          <img
            src="/img/InnoApp - Logotipo - vector.svg"
            alt="InnoApp"
            className="w-72 object-contain"
          />
          <p className="text-brand-200 text-lg font-medium max-w-xs leading-relaxed">
            Gestiona las finanzas del hogar de forma simple y eficiente
          </p>
          <div className="flex gap-3 mt-4">
            {["#c5efec", "#8cf4ee", "#59b2b0", "#448481"].map((c) => (
              <span key={c} className="h-2 w-8 rounded-full opacity-80" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-dvh w-full items-start justify-center overflow-y-auto bg-white px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))] sm:items-center sm:px-6 lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <BrandLogo />
          </div>

          <p className="text-sm font-semibold uppercase text-brand tracking-wide">Finanzas del hogar</p>
          <h1 className="mt-2 mb-8 text-3xl font-bold text-ink">Iniciar sesión</h1>

          {error ? <ErrorState label={error} /> : null}

          <form className="grid gap-5" onSubmit={onSubmit}>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Contraseña" error={errors.password?.message}>
              <Input type="password" autoComplete="current-password" {...register("password")} />
            </Field>
            <Button type="submit" disabled={isSubmitting} className="mt-1">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            ¿No tienes cuenta?{" "}
            <Link className="font-semibold text-brand hover:text-brand-700" to="/registro">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
