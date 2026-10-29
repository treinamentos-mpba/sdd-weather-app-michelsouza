import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService.ts';
import type { City } from '../../../src/types/weather.ts';

describe('searchCities', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna lista vazia sem chamar a rede quando o nome é vazio', async () => {
    await expect(searchCities('')).resolves.toEqual([]);
    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mapeia results para City e codifica o nome', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            name: 'São Paulo',
            country: 'Brasil',
            latitude: -23.55,
            longitude: -46.63,
            admin1: 'São Paulo',
            extra: 'ignorado',
          },
          {
            name: 'Paris',
            country: 'França',
            latitude: 48.85,
            longitude: 2.35,
          },
        ],
      }),
    });

    await expect(searchCities('  São Paulo  ')).resolves.toEqual([
      {
        name: 'São Paulo',
        country: 'Brasil',
        latitude: -23.55,
        longitude: -46.63,
        region: 'São Paulo',
      },
      {
        name: 'Paris',
        country: 'França',
        latitude: 48.85,
        longitude: 2.35,
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&count=10&language=pt',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('retorna [] quando a resposta ok não traz results', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(searchCities('Salvador')).resolves.toEqual([]);
  });

  it('lança WeatherServiceError quando a resposta não é ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(searchCities('Salvador')).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(searchCities('Salvador')).rejects.toMatchObject({ status: 503 });
  });
});

const city: City = {
  name: 'Salvador',
  country: 'Brasil',
  region: 'Bahia',
  latitude: -12.97,
  longitude: -38.51,
};

function forecastPayload(overrides: Record<string, unknown> = {}) {
  return {
    current: {
      temperature_2m: 29,
      weather_code: 2,
      relative_humidity_2m: 78,
      wind_speed_10m: 14,
      precipitation: 0.2,
      pressure_msl: 1013,
    },
    daily: {
      time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
      temperature_2m_max: [31, 30, 29, 28, 30],
      temperature_2m_min: [24, 23, 24, 23, 24],
      weather_code: [2, 1, 3, 61, 0],
      precipitation_probability_max: [20, 10, 40, 80, 5],
    },
    ...overrides,
  };
}

describe('getWeather', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mapeia current e cinco dias alinhados', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => forecastPayload(),
    });

    const weather = await getWeather(city);

    expect(weather.current).toEqual({
      status: 'success',
      data: {
        temperatureC: 29,
        weatherCode: 2,
        description: 'Parcialmente nublado',
        humidity: 78,
        windSpeedKmh: 14,
        precipitationMm: 0.2,
        pressureHpa: 1013,
      },
    });
    expect(weather.daily.status).toBe('success');
    if (weather.daily.status === 'success') {
      expect(weather.daily.data.days).toHaveLength(5);
      expect(weather.daily.data.isPartial).toBe(false);
      expect(weather.daily.data.days[0]).toMatchObject({
        date: '2026-10-29',
        maxTemperatureC: 31,
        minTemperatureC: 24,
        weatherCode: 2,
        precipitationProbability: 20,
      });
      expect(weather.daily.data.days[3]?.description).toBe('Chuva fraca');
    }
    expect(weather.fetchedAt).toBeInstanceOf(Date);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('latitude=-12.97');
    expect(url).toContain('longitude=-38.51');
    expect(url).toContain('forecast_days=5');
    expect(url).toContain('timezone=auto');
    expect(url).toContain('temperature_unit=celsius');
    expect(url).toContain('current=');
    expect(url).toContain('daily=');
  });

  it('lança WeatherServiceError quando current ou daily estão ausentes', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => forecastPayload({ current: undefined }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => forecastPayload({ daily: undefined }),
    });

    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('fetchWithTimeout', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('limpa o timeout quando a rede responde', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    fetchMock.mockResolvedValue({ ok: true });

    await expect(fetchWithTimeout('https://example.com/clima')).resolves.toEqual({ ok: true });
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('converte falha de rede e abort em WeatherServiceError', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(fetchWithTimeout('https://example.com/clima')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });

    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValueOnce(abortError);
    await expect(fetchWithTimeout('https://example.com/clima')).rejects.toMatchObject({
      message: 'A requisição demorou demais.',
    });
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('aborta a requisição após 10 segundos', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const pending = fetchWithTimeout('https://example.com/clima');
    const assertion = expect(pending).rejects.toMatchObject({
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });
});
