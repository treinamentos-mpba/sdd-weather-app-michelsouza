import { type FormEvent, useId, useState } from 'react';

const MIN_TERM_LENGTH = 2;

export interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const hintId = useId();
  const [term, setTerm] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }

    const city = term.trim();
    if (city.length < MIN_TERM_LENGTH) {
      setHint('Informe um nome de cidade com pelo menos 2 caracteres.');
      return;
    }

    setHint(null);
    onSearch(city);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-white">
        Buscar cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="city"
          type="text"
          value={term}
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Ex.: Salvador"
          aria-invalid={hint !== null}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => {
            setTerm(event.target.value);
            if (hint) {
              setHint(null);
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-night-900/60 px-4 py-3 text-base text-white outline-none placeholder:text-white/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="min-h-11 rounded-xl bg-accent-500 px-4 py-3 font-medium text-white hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </div>
      {hint ? (
        <p id={hintId} role="status" className="mt-2 text-sm text-sun">
          {hint}
        </p>
      ) : null}
    </form>
  );
}
