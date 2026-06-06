import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "bg-brand text-white shadow-brand hover:bg-brand-700",
  secondary: "bg-white text-ink ring-1 ring-brand-100 hover:bg-brand-50",
  danger: "bg-danger text-white hover:bg-red-700",
  ghost: "bg-transparent text-muted hover:bg-brand-50 hover:text-ink"
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) => (
  <button
    className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
