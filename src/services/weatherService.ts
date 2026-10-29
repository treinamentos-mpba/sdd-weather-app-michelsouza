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
  results?: GeocodingResult[];
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

function isCityResult(result: GeocodingResult): result is GeocodingResult & {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
} {
  return (
    typeof result.name === 'string' &&
    typeof result.country === 'string' &&
    typeof result.latitude === 'number' &&
    typeof result.longitude === 'number'
  );
}

function toCity(result: GeocodingResult): City {
  if (!isCityResult(result)) {
    throw new WeatherServiceError('A resposta da busca de cidades veio incompleta.');
  }

  const city: City = {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };

  if (typeof result.admin1 === 'string' && result.admin1.trim().length > 0) {
    city.region = result.admin1;
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

  return payload.results.map(toCity);
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

function requireNumber(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new WeatherServiceError('A resposta do clima veio incompleta.');
  }
  return value;
}

/** Campo opcional da Open-Meteo. Ausente ou null vira zero, não erro. */
function numberOrZero(value: unknown): number {
  if (value == null) {
    return 0;
  }
  return requireNumber(value);
}

function requireText(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new WeatherServiceError('A resposta do clima veio incompleta.');
  }
  return value;
}

function toCurrentWeather(current: ForecastCurrent): CurrentWeather {
  const weatherCode = requireNumber(current.weather_code);
  return {
    temperatureC: requireNumber(current.temperature_2m),
    weatherCode,
    description: getWeatherDescription(weatherCode),
    humidity: requireNumber(current.relative_humidity_2m),
    windSpeedKmh: requireNumber(current.wind_speed_10m),
    precipitationMm: numberOrZero(current.precipitation),
    pressureHpa: requireNumber(current.pressure_msl),
  };
}

function toForecastDay(
  dates: unknown[],
  maxTemperatures: unknown[],
  minTemperatures: unknown[],
  codes: unknown[],
  rain: unknown[],
  index: number,
): ForecastDay {
  const weatherCode = requireNumber(codes[index]);
  return {
    date: requireText(dates[index]),
    maxTemperatureC: requireNumber(maxTemperatures[index]),
    minTemperatureC: requireNumber(minTemperatures[index]),
    weatherCode,
    description: getWeatherDescription(weatherCode),
    precipitationProbability: numberOrZero(rain[index]),
  };
}

/** Dias alinhados e válidos, no máximo cinco. Dia inválido é omitido, nunca inventado. */
function toForecastDays(daily: ForecastDaily): ForecastDay[] {
  const dates = daily.time;
  const maxTemperatures = daily.temperature_2m_max;
  const minTemperatures = daily.temperature_2m_min;
  const codes = daily.weather_code;
  const rain = daily.precipitation_probability_max;
  if (
    !Array.isArray(dates) ||
    !Array.isArray(maxTemperatures) ||
    !Array.isArray(minTemperatures) ||
    !Array.isArray(codes) ||
    !Array.isArray(rain)
  ) {
    throw new WeatherServiceError('A resposta do clima veio incompleta.');
  }

  const length = Math.min(
    FORECAST_DAYS,
    dates.length,
    maxTemperatures.length,
    minTemperatures.length,
    codes.length,
    rain.length,
  );
  const days: ForecastDay[] = [];
  for (let index = 0; index < length; index += 1) {
    try {
      days.push(toForecastDay(dates, maxTemperatures, minTemperatures, codes, rain, index));
    } catch (error) {
      if (!(error instanceof WeatherServiceError)) {
        throw error;
      }
    }
  }
  return days;
}

function incompletePanel<T>(message = 'A resposta do clima veio incompleta.'): PanelState<T> {
  const error: AppError = { kind: 'invalid-payload', message };
  return { status: 'error', error };
}

function mapCurrent(current: ForecastCurrent | undefined): PanelState<CurrentWeather> {
  if (!current) {
    return incompletePanel();
  }
  try {
    return { status: 'success', data: toCurrentWeather(current) };
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return incompletePanel(error.message);
    }
    throw error;
  }
}

function mapDaily(daily: ForecastDaily | undefined): PanelState<DailyForecast> {
  if (!daily) {
    return incompletePanel();
  }
  try {
    const days = toForecastDays(daily);
    return {
      status: 'success',
      data: { days, isPartial: days.length < FORECAST_DAYS },
    };
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      return incompletePanel(error.message);
    }
    throw error;
  }
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
