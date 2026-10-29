export interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-glass backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-3 block h-8 w-8 animate-pulse rounded-full bg-accent-400/80 motion-reduce:animate-none"
      />
      <p className="text-sm font-medium text-white">{message}</p>
    </div>
  );
}
