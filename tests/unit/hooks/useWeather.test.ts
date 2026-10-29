import { act, renderHook } from '@testing-library/react';
import { useWeather } from '../../../src/hooks/useWeather.ts';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService.ts';
import type { City, WeatherData } from '../../../src/types/weather.ts';

vi.mock('../../../src/services/weatherService.ts', async () => {
  const actual = await vi.importActual<typeof import('../../../src/services/weatherService.ts')>(
    '../../../src/services/weatherService.ts',
  );
  return {
    ...actual,
    searchCities: vi.fn(),
    getWeather: vi.fn(),
  };
});

const salvador: City = {
  name: 'Salvador',
  country: 'Brasil',
  region: 'Bahia',
  latitude: -12.97,
  longitude: -38.51,
};

const lisboa: City = {
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.72,
  longitude: -9.14,
};

function weatherFor(city: City): WeatherData {
  return {
    fetchedAt: new Date('2026-10-29T15:30:00.000Z'),
    current: {
      status: 'success',
      data: {
        temperatureC: city.name === 'Lisboa' ? 18 : 29,
        weatherCode: 2,
        description: 'Parcialmente nublado',
        humidity: 70,
        windSpeedKmh: 12,
        precipitationMm: 0,
        pressureHpa: 1012,
      },
    },
    daily: {
      status: 'success',
      data: { isPartial: false, days: [] },
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.mocked(searchCities).mockReset();
    vi.mocked(getWeather).mockReset();
  });

  it('começa idle, sem dados nem erro', () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.cities).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.query).toBe('');
  });

  it('busca cidades e carrega o clima da primeira', async () => {
    vi.mocked(searchCities).mockResolvedValue([salvador, lisboa]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(salvador));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('  Salvador  ');
    });

    expect(searchCities).toHaveBeenCalledWith('Salvador');
    expect(getWeather).toHaveBeenCalledWith(salvador);
    expect(result.current.status).toBe('success');
    expect(result.current.query).toBe('Salvador');
    expect(result.current.cities).toEqual([salvador, lisboa]);
    expect(result.current.data?.city).toEqual(salvador);
    expect(result.current.data?.current).toEqual(weatherFor(salvador).current);
    expect(result.current.error).toBeNull();
  });

  it('fica vazio quando a busca não encontra cidades', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Atlântida');
    });

    expect(getWeather).not.toHaveBeenCalled();
    expect(result.current.status).toBe('empty');
    expect(result.current.cities).toEqual([]);
    expect(result.current.data).toBeNull();
    expect(result.current.query).toBe('Atlântida');
  });

  it('expõe a mensagem do service quando a busca ou o clima falha', async () => {
    vi.mocked(searchCities).mockRejectedValue(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Salvador');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Falha de rede.');
    expect(result.current.data).toBeNull();

    vi.mocked(searchCities).mockResolvedValue([salvador]);
    vi.mocked(getWeather).mockRejectedValue(
      new WeatherServiceError('A requisição demorou demais.'),
    );
    await act(async () => {
      await result.current.search('Salvador');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('A requisição demorou demais.');
    expect(result.current.cities).toEqual([salvador]);
  });

  it('seleciona outra cidade e o retry repete só essa seleção', async () => {
    vi.mocked(searchCities).mockResolvedValue([salvador, lisboa]);
    vi.mocked(getWeather)
      .mockResolvedValueOnce(weatherFor(salvador))
      .mockRejectedValueOnce(new WeatherServiceError('Não foi possível consultar o clima.'))
      .mockResolvedValueOnce(weatherFor(lisboa));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Salvador');
    });
    await act(async () => {
      await result.current.selectCity(lisboa);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.cities).toEqual([salvador, lisboa]);
    expect(searchCities).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.retry();
    });

    expect(getWeather).toHaveBeenLastCalledWith(lisboa);
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(lisboa);
  });

  it('refaz a última busca quando o retry acontece depois de uma pesquisa', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'))
      .mockResolvedValueOnce([salvador]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(salvador));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Salvador');
    });
    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).toHaveBeenNthCalledWith(2, 'Salvador');
    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(salvador);
  });

  it('descarta a resposta de uma busca antiga', async () => {
    const slowSearch = deferred<City[]>();
    vi.mocked(searchCities)
      .mockImplementationOnce(() => slowSearch.promise)
      .mockResolvedValueOnce([lisboa]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(lisboa));
    const { result } = renderHook(() => useWeather());

    let firstSearch: Promise<void> = Promise.resolve();
    act(() => {
      firstSearch = result.current.search('Salvador');
    });
    await act(async () => {
      await result.current.search('Lisboa');
    });

    await act(async () => {
      slowSearch.resolve([salvador]);
      await firstSearch;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.query).toBe('Lisboa');
    expect(result.current.data?.city).toEqual(lisboa);
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledWith(lisboa);
  });
});
