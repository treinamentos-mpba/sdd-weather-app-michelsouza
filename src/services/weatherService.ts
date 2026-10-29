import { getWeatherDescription } from '../lib/weatherCodes.ts';
import type {
  AppError,
  City,
  CurrentWeather,
  DailyForecast,
  ForecastDay,
  PanelState,
  WeatherData,
} from '../types/weather.ts';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 5;
const REQUEST_TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WeatherServiceError';
    this.status = status;
  }
}

interface GeocodingResult {
  name?: unknown;
  country?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  admin1?: unknown;
}

interface GeocodingResponse {
  results?: Array<GeocodingResult | null>;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Busca com timeout de 10s. Abort e falha de rede viram WeatherServiceError. */
export async function fetchWithTimeout(
  url: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    throw new WeatherServiceError('Falha de rede.');
  } finally {
    clearTimeout(timeoutId);
  }
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value;
}

/** Resultado sem nome ou coordenada não é selecionável. País ausente vira "—". */
function toCity(result: GeocodingResult | null): City | null {
  if (!result) {
    return null;
  }
  const name = optionalText(result.name);
  const latitude = finiteNumber(result.latitude);
  const longitude = finiteNumber(result.longitude);
  if (name == null || latitude == null || longitude == null) {
    return null;
  }

  const city: City = {
    name,
    country: optionalText(result.country) ?? '—',
    latitude,
    longitude,
  };
  const region = optionalText(result.admin1);
  if (region) {
    city.region = region;
  }
  return city;
}

/** Busca cidades na Open-Meteo. Input vazio não chama a rede. */
export async function searchCities(name: string): Promise<City[]> {
  const term = name.trim();
  if (term.length === 0) {
    return [];
  }

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(term)}&count=10&language=pt`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível buscar cidades.', response.status);
  }

  const payload = (await response.json()) as GeocodingResponse;
  if (payload.results === undefined) {
    return [];
  }
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('A resposta da busca de cidades veio incompleta.');
  }

  return payload.results.flatMap((result) => {
    const city = toCity(result);
    return city ? [city] : [];
  });
}

interface ForecastCurrent {
  temperature_2m?: unknown;
  weather_code?: unknown;
  relative_humidity_2m?: unknown;
  wind_speed_10m?: unknown;
  precipitation?: unknown;
  pressure_msl?: unknown;
}

interface ForecastDaily {
  time?: unknown;
  temperature_2m_max?: unknown;
  temperature_2m_min?: unknown;
  weather_code?: unknown;
  precipitation_probability_max?: unknown;
}

interface ForecastResponse {
  current?: ForecastCurrent;
  daily?: ForecastDaily;
}

/** Precipitação e chance de chuva. Ausente, null ou inválido vira zero, não NaN. */
function numberOrZero(value: unknown): number {
  return finiteNumber(value) ?? 0;
}

function asColumn(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toCurrentWeather(current: ForecastCurrent): CurrentWeather {
  const weatherCode = finiteNumber(current.weather_code);
  return {
    temperatureC: finiteNumber(current.temperature_2m),
    weatherCode,
    description: getWeatherDescription(weatherCode),
    humidity: finiteNumber(current.relative_humidity_2m),
    windSpeedKmh: finiteNumber(current.wind_speed_10m),
    precipitationMm: numberOrZero(current.precipitation),
    pressureHpa: finiteNumber(current.pressure_msl),
  };
}

/** Sem data ISO o dia não existe. Métrica ausente permanece null para a UI mostrar "—". */
function toForecastDay(
  dates: unknown[],
  maxTemperatures: unknown[],
  minTemperatures: unknown[],
  codes: unknown[],
  rain: unknown[],
  index: number,
): ForecastDay | null {
  const date = optionalText(dates[index]);
  if (date == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const weatherCode = finiteNumber(codes[index]);
  return {
    date,
    maxTemperatureC: finiteNumber(maxTemperatures[index]),
    minTemperatureC: finiteNumber(minTemperatures[index]),
    weatherCode,
    description: getWeatherDescription(weatherCode),
    precipitationProbability: numberOrZero(rain[index]),
  };
}

/** Até cinco dias com data. Coluna ausente não derruba o dia; data ausente omite só aquele índice. */
function toForecastDays(daily: ForecastDaily): ForecastDay[] {
  const dates = asColumn(daily.time);
  const maxTemperatures = asColumn(daily.temperature_2m_max);
  const minTemperatures = asColumn(daily.temperature_2m_min);
  const codes = asColumn(daily.weather_code);
  const rain = asColumn(daily.precipitation_probability_max);
  const length = Math.min(FORECAST_DAYS, dates.length);
  const days: ForecastDay[] = [];
  for (let index = 0; index < length; index += 1) {
    const day = toForecastDay(dates, maxTemperatures, minTemperatures, codes, rain, index);
    if (day) {
      days.push(day);
    }
  }
  return days;
}

function incompletePanel<T>(message = 'A resposta do clima veio incompleta.'): PanelState<T> {
  const error: AppError = { kind: 'invalid-payload', message };
  return { status: 'error', error };
}

function mapCurrent(current: ForecastCurrent | undefined): PanelState<CurrentWeather> {
  if (!current || typeof current !== 'object') {
    return incompletePanel();
  }
  return { status: 'success', data: toCurrentWeather(current) };
}

function mapDaily(daily: ForecastDaily | undefined): PanelState<DailyForecast> {
  if (!daily || typeof daily !== 'object') {
    return incompletePanel();
  }
  const days = toForecastDays(daily);
  return {
    status: 'success',
    data: { days, isPartial: days.length < FORECAST_DAYS },
  };
}

/** Consulta o clima. Um bloco ausente não derruba o outro; os dois ausentes são erro. */
export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,pressure_msl',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
    temperature_unit: 'celsius',
  });
  const response = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível consultar o clima.', response.status);
  }

  let payload: ForecastResponse;
  try {
    payload = (await response.json()) as ForecastResponse;
  } catch {
    throw new WeatherServiceError('A resposta do clima veio incompleta.');
  }
  if (!payload || typeof payload !== 'object') {
    throw new WeatherServiceError('A resposta do clima veio incompleta.');
  }

  const current = mapCurrent(payload.current);
  const daily = mapDaily(payload.daily);
  if (current.status === 'error' && daily.status === 'error') {
    throw new WeatherServiceError(current.error.message);
  }

  return { current, daily, fetchedAt: new Date() };
}
