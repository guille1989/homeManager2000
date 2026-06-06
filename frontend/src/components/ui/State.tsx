export const LoadingState = ({ label = "Cargando..." }: { label?: string }) => (
  <div className="rounded-lg border border-dashed border-brand-200 bg-white/90 p-6 text-center text-sm text-muted">
    {label}
  </div>
);

export const EmptyState = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-dashed border-brand-200 bg-white/90 p-6 text-center text-sm text-muted">
    {label}
  </div>
);

export const ErrorState = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
    {label}
  </div>
);
