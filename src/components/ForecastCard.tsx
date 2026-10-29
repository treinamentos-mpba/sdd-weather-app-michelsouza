import { useId } from 'react';
import { formatDayLabel } from '../lib/format.ts';
import { formatTemperature } from '../lib/temperature.ts';
import { getWeatherIcon } from '../lib/weatherCodes.ts';
import type { ForecastDay, Unit } from '../types/weather.ts';

export interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const headingId = useId();
  const label = formatDayLabel(day.date);
  const condition = day.description.trim() || 'Condição desconhecida';
  const rain = Number.isFinite(day.precipitationProbability)
    ? Math.round(day.precipitationProbability)
    : null;

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full min-w-0 flex-col items-center break-words rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-center shadow-glass backdrop-blur-md sm:px-3"
    >
      <h3 id={headingId} className="text-sm font-medium text-white">
        {label}
      </h3>
      <span aria-hidden="true" className="mt-2 text-3xl">
        {getWeatherIcon(day.weatherCode)}
      </span>
      <p className="mt-1 text-sm text-white/80">{condition}</p>
      <p className="mt-3 flex flex-wrap items-baseline justify-center gap-x-1 text-sm text-white">
        <span className="font-semibold">{formatTemperature(day.maxTemperatureC, unit)}</span>
        <span className="sr-only"> de máxima e </span>
        <span aria-hidden="true" className="text-white/70">
          /
        </span>
        <span>{formatTemperature(day.minTemperatureC, unit)}</span>
        <span className="sr-only"> de mínima</span>
      </p>
      <p className="mt-2 text-xs text-white/80">
        Chuva {rain == null ? '—' : `${rain}%`}
      </p>
    </article>
  );
}
