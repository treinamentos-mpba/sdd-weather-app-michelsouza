export interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div
      role="status"
      tabIndex={-1}
      data-focus-result
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-glass outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white"
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/80">{hint}</p>
    </div>
  );
}
