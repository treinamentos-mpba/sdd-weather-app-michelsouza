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

  it('ignora resultado sem nome e usa traço quando o país vem null', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { name: null, country: 'Brasil', latitude: 1, longitude: 2 },
          {
            name: 'Salvador',
            country: null,
            latitude: -12.97,
            longitude: -38.51,
            admin1: null,
          },
        ],
      }),
    });

    await expect(searchCities('Salvador')).resolves.toEqual([
      {
        name: 'Salvador',
        country: '—',
        latitude: -12.97,
        longitude: -38.51,
      },
    ]);
  });

  it('codifica acento, apóstrofo e emoji e não interpreta o termo', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const terms = ['São Luís', "Val-d'Or", '123🌧'];
    for (const term of terms) {
      await expect(searchCities(term)).resolves.toEqual([]);
    }

    expect(fetchMock).toHaveBeenCalledTimes(terms.length);
    for (const [index, term] of terms.entries()) {
      expect(fetchMock).toHaveBeenNthCalledWith(
        index + 1,
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=10&language=pt`,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    }
  });

  it('retorna [] quando results vem vazio ou ausente', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(searchCities('Salvador')).resolves.toEqual([]);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    await expect(searchCities('Atlântida')).resolves.toEqual([]);
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

  it('trata precipitação null como zero e mantém os cinco dias', async () => {
    const payload = forecastPayload() as {
      current: { precipitation: number | null };
      daily: { precipitation_probability_max: Array<number | null> };
    };
    payload.current.precipitation = null;
    payload.daily.precipitation_probability_max = [null, 10, 40, 80, 5];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const weather = await getWeather(city);

    expect(weather.current.status).toBe('success');
    if (weather.current.status === 'success') {
      expect(weather.current.data.precipitationMm).toBe(0);
    }
    expect(weather.daily.status).toBe('success');
    if (weather.daily.status === 'success') {
      expect(weather.daily.data.days).toHaveLength(5);
      expect(weather.daily.data.days.map((day) => day.precipitationProbability)).toEqual([
        0, 10, 40, 80, 5,
      ]);
    }
  });

  it('lança WeatherServiceError em falha HTTP, rede ou JSON inválido', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status: 503,
      message: 'Não foi possível consultar o clima.',
    });

    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(getWeather(city)).rejects.toMatchObject({ message: 'Falha de rede.' });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('invalid json');
      },
    });
    await expect(getWeather(city)).rejects.toMatchObject({
      message: 'A resposta do clima veio incompleta.',
    });
  });

  it('mantém o painel válido quando o outro bloco está ausente', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => forecastPayload({ daily: undefined }),
    });
    const withoutDaily = await getWeather(city);
    expect(withoutDaily.current.status).toBe('success');
    expect(withoutDaily.daily).toEqual({
      status: 'error',
      error: { kind: 'invalid-payload', message: 'A resposta do clima veio incompleta.' },
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => forecastPayload({ current: undefined }),
    });
    const withoutCurrent = await getWeather(city);
    expect(withoutCurrent.current.status).toBe('error');
    expect(withoutCurrent.daily.status).toBe('success');
    if (withoutCurrent.daily.status === 'success') {
      expect(withoutCurrent.daily.data.days).toHaveLength(5);
      expect(withoutCurrent.daily.data.isPartial).toBe(false);
    }
  });

  it('devolve só os dias válidos, sem inventar o restante', async () => {
    const payload = forecastPayload();
    payload.daily.time = payload.daily.time.slice(0, 3);
    payload.daily.temperature_2m_max = payload.daily.temperature_2m_max.slice(0, 3);
    payload.daily.temperature_2m_min = payload.daily.temperature_2m_min.slice(0, 3);
    payload.daily.weather_code = payload.daily.weather_code.slice(0, 3);
    payload.daily.precipitation_probability_max = payload.daily.precipitation_probability_max.slice(
      0,
      3,
    );
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });

    const partial = await getWeather(city);
    expect(partial.daily.status).toBe('success');
    if (partial.daily.status === 'success') {
      expect(partial.daily.data.isPartial).toBe(true);
      expect(partial.daily.data.days.map((day) => day.date)).toEqual([
        '2026-10-29',
        '2026-10-30',
        '2026-10-31',
      ]);
    }

    const gapped = forecastPayload();
    const maxTemperatures = gapped.daily.temperature_2m_max as Array<number | null>;
    maxTemperatures[2] = null;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => gapped,
    });
    const skipped = await getWeather(city);
    if (skipped.daily.status === 'success') {
      expect(skipped.daily.data.days).toHaveLength(5);
      expect(skipped.daily.data.isPartial).toBe(false);
      expect(skipped.daily.data.days[2]).toMatchObject({
        date: '2026-10-31',
        maxTemperatureC: null,
        minTemperatureC: 24,
      });
    }
  });

  it('usa null ou zero quando a Open-Meteo omite medições', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        forecastPayload({
          current: {
            temperature_2m: null,
            weather_code: null,
            relative_humidity_2m: null,
            wind_speed_10m: null,
            precipitation: null,
            pressure_msl: null,
          },
          daily: {
            time: ['2026-10-29', null, '2026-10-31'],
            temperature_2m_max: [null, 30, 29],
            temperature_2m_min: [24, null, 23],
            weather_code: [null, 1, 3],
            precipitation_probability_max: [null, 10, null],
          },
        }),
    });

    const weather = await getWeather(city);
    expect(weather.current).toEqual({
      status: 'success',
      data: {
        temperatureC: null,
        weatherCode: null,
        description: 'Condição desconhecida',
        humidity: null,
        windSpeedKmh: null,
        precipitationMm: 0,
        pressureHpa: null,
      },
    });
    expect(weather.daily.status).toBe('success');
    if (weather.daily.status === 'success') {
      expect(weather.daily.data.days.map((day) => day.date)).toEqual(['2026-10-29', '2026-10-31']);
      expect(weather.daily.data.days[0]).toMatchObject({
        maxTemperatureC: null,
        minTemperatureC: 24,
        weatherCode: null,
        description: 'Condição desconhecida',
        precipitationProbability: 0,
      });
      expect(weather.daily.data.isPartial).toBe(true);
    }
  });

  it('lança WeatherServiceError quando current e daily estão ausentes', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => forecastPayload({ current: undefined, daily: undefined }),
    });

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
