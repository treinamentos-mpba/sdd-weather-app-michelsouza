import { useCallback, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService.ts';
import type { City, WeatherData } from '../types/weather.ts';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

/** Clima carregado junto da cidade que o originou. */
export type WeatherResult = WeatherData & {
  city: City;
};

type LastOperation = { kind: 'search'; name: string } | { kind: 'select'; city: City };

export interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherResult | null;
  cities: City[];
  error: string | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof WeatherServiceError) {
    return error.message;
  }
  return 'Não foi possível consultar o clima.';
}

/**
 * Orquestra busca de cidades e carregamento do clima.
 * `retry` repete a última operação do usuário: nova busca ou nova seleção.
 */
export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherResult | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const lastOperation = useRef<LastOperation | null>(null);
  const requestId = useRef(0);

  const fail = useCallback((id: number, caught: unknown) => {
    if (requestId.current !== id) {
      return;
    }
    setData(null);
    setError(toErrorMessage(caught));
    setStatus('error');
  }, []);

  const loadWeather = useCallback(async (city: City, id: number) => {
    const weather = await getWeather(city);
    if (requestId.current !== id) {
      return;
    }
    setData({ ...weather, city });
    setError(null);
    setStatus('success');
  }, []);

  const search = useCallback(
    async (name: string) => {
      const term = name.trim();
      const id = requestId.current + 1;
      requestId.current = id;
      lastOperation.current = { kind: 'search', name: term };
      setQuery(term);
      setCities([]);
      setData(null);
      setError(null);
      setStatus('loading');

      try {
        const results = await searchCities(term);
        if (requestId.current !== id) {
          return;
        }
        setCities(results);
        const first = results[0];
        if (!first) {
          setStatus('empty');
          return;
        }
        await loadWeather(first, id);
      } catch (caught) {
        fail(id, caught);
      }
    },
    [fail, loadWeather],
  );

  const selectCity = useCallback(
    async (city: City) => {
      const id = requestId.current + 1;
      requestId.current = id;
      lastOperation.current = { kind: 'select', city };
      setData(null);
      setError(null);
      setStatus('loading');

      try {
        await loadWeather(city, id);
      } catch (caught) {
        fail(id, caught);
      }
    },
    [fail, loadWeather],
  );

  const retry = useCallback(async () => {
    const operation = lastOperation.current;
    if (!operation) {
      return;
    }
    if (operation.kind === 'search') {
      await search(operation.name);
      return;
    }
    await selectCity(operation.city);
  }, [search, selectCity]);

  return { status, data, cities, error, query, search, selectCity, retry };
}
