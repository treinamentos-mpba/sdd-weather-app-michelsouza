import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather.tsx';
import ForecastList from './components/ForecastList.tsx';
import SearchBar from './components/SearchBar.tsx';
import EmptyState from './components/states/EmptyState.tsx';
import ErrorState from './components/states/ErrorState.tsx';
import LoadingState from './components/states/LoadingState.tsx';
import UnitToggle from './components/UnitToggle.tsx';
import { useWeather } from './hooks/useWeather.ts';
import type { Unit } from './types/weather.ts';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, search, retry } = useWeather();
  const pendingFocus = useRef(false);

  function runSearch(term: string) {
    pendingFocus.current = true;
    void search(term);
  }

  function runRetry() {
    pendingFocus.current = true;
    void retry();
  }

  useEffect(() => {
    if (!pendingFocus.current || status === 'idle' || status === 'loading') {
      return;
    }
    pendingFocus.current = false;
    document.getElementById('conteudo')?.querySelector<HTMLElement>('[data-focus-result]')?.focus();
  }, [status]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-3 py-6 sm:px-6">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-20 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-medium focus:text-night-900 focus:outline-none focus:ring-2 focus:ring-accent-400"
      >
        Ir para o conteúdo
      </a>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="shrink-0">
          <p className="text-sm font-semibold tracking-wide text-accent-400">SDD Weather</p>
          <h1 className="text-2xl font-semibold text-white">Clima</h1>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchBar onSearch={runSearch} disabled={status === 'loading'} />
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="flex flex-1 flex-col gap-4 outline-none">
        {status === 'idle' ? (
          <EmptyState
            title="Pesquise uma cidade"
            hint="Digite o nome de uma cidade para ver o clima e a previsão."
          />
        ) : null}
        {status === 'loading' ? <LoadingState message="Consultando o clima..." /> : null}
        {status === 'empty' ? (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint="Revise o texto digitado e tente outro nome."
          />
        ) : null}
        {status === 'error' ? (
          <ErrorState
            message={error ?? 'Não foi possível consultar o clima. Tente novamente.'}
            onRetry={runRetry}
          />
        ) : null}
        {status === 'success' && data ? (
          <>
            {data.current.status === 'success' ? (
              <CurrentWeather city={data.city} current={data.current.data} unit={unit} />
            ) : (
              <ErrorState message={data.current.error.message} onRetry={runRetry} />
            )}
            {data.daily.status === 'success' ? (
              <ForecastList days={data.daily.data.days} unit={unit} />
            ) : (
              <ErrorState message={data.daily.error.message} onRetry={runRetry} />
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
