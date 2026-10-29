import type { ForecastDay, Unit } from '../types/weather.ts';
import ForecastCard from './ForecastCard.tsx';

export interface ForecastListProps {
  days: ForecastDay[];
  unit: Unit;
}

function partialMessage(count: number): string {
  if (count === 0) {
    return 'Previsão incompleta: nenhum dia disponível.';
  }
  if (count === 1) {
    return 'Previsão incompleta: apenas 1 dia disponível.';
  }
  return `Previsão incompleta: apenas ${count} dias disponíveis.`;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  const isPartial = days.length < 5;

  const label = days.length === 5 ? 'Previsão de 5 dias' : 'Previsão';

  return (
    <section aria-label={label} className="w-full">
      {isPartial ? (
        <p role="status" className="mb-3 text-sm text-sun">
          {partialMessage(days.length)}
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {days.map((day) => (
          <li key={day.date} className="min-w-0">
            <ForecastCard day={day} unit={unit} />
          </li>
        ))}
      </ul>
    </section>
  );
}
