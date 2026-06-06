import type { InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes } from "react";

type FieldProps = PropsWithChildren<{
  label: string;
  error?: string;
}>;

export const Field = ({ label, error, children }: FieldProps) => (
  <label className="grid gap-1.5 text-sm font-medium text-ink">
    <span>{label}</span>
    {children}
    {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
  </label>
);

export const inputClass =
  "min-h-10 rounded-md border border-brand-100 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-100";

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`${inputClass} ${props.className ?? ""}`} {...props} />
);

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`${inputClass} ${props.className ?? ""}`} {...props} />
);
