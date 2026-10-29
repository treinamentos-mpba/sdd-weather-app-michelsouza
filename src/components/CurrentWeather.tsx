import {
  formatTemperature,
  temperatureUnitLabel,
  toDisplayTemperature,
} from '../lib/temperature.ts';
import { getWeatherIcon } from '../lib/weatherCodes.ts';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather.ts';

export interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

const metricFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatMetric(value: number | null, suffix: string): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  return `${metricFormat.format(value)}${suffix}`;
}

function formatLocation(city: City): string {
  return [city.name, city.region, city.country]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const condition = current.description.trim() || 'Condição desconhecida';
  const celsius = current.temperatureC;
  const temperature =
    celsius != null && Number.isFinite(celsius) ? toDisplayTemperature(celsius, unit) : null;
  const unitLabel = temperatureUnitLabel(unit);
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidity, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, ' km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, ' mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, ' hPa') },
  ];

  return (
    <section
      aria-label="Clima atual"
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-6"
    >
      <h2
        tabIndex={-1}
        data-focus-result
        className="break-words text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {formatLocation(city)}
      </h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-5xl font-semibold leading-none tracking-tight text-white sm:text-7xl">
          <span className="sr-only">{formatTemperature(current.temperatureC, unit)}</span>
          <span aria-hidden="true">{temperature ?? '—'}</span>
          {temperature != null ? (
            <span
              aria-hidden="true"
              className="ml-2 align-top text-3xl font-medium text-sun sm:text-4xl"
            >
              {unitLabel}
            </span>
          ) : null}
        </p>
        <span aria-hidden="true" className="shrink-0 text-4xl sm:text-6xl">
          {getWeatherIcon(current.weatherCode)}
        </span>
      </div>
      <p className="mt-2 text-lg text-white">{condition}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
          >
            <dt className="text-xs text-white/80">{metric.label}</dt>
            <dd className="mt-1 text-base font-medium text-white">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
