import type { PropsWithChildren } from "react";

export const Card = ({ children, className = "" }: PropsWithChildren<{ className?: string }>) => (
  <section className={`rounded-lg border border-brand-100 bg-white/95 p-4 shadow-panel ${className}`}>
    {children}
  </section>
);
