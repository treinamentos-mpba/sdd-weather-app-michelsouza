export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      tabIndex={-1}
      data-focus-result
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-glass outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white"
    >
      <p className="text-base text-white">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-xl bg-accent-500 px-4 py-3 font-medium text-white hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
      >
        Tentar novamente
      </button>
    </div>
  );
}
