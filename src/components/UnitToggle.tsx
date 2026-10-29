import { type KeyboardEvent, useRef } from 'react';
import type { Unit } from '../types/weather.ts';

const UNITS = [
  { value: 'celsius', label: '°C', name: 'Celsius' },
  { value: 'fahrenheit', label: '°F', name: 'Fahrenheit' },
] as const satisfies ReadonlyArray<{ value: Unit; label: string; name: string }>;

export interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const buttonRefs = useRef<Partial<Record<Unit, HTMLButtonElement>>>({});

  function select(next: Unit) {
    if (next !== unit) {
      onChange(next);
    }
    buttonRefs.current[next]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = UNITS.findIndex((item) => item.value === unit);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % UNITS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + UNITS.length) % UNITS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = UNITS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const next = UNITS[nextIndex];
    if (next) {
      select(next.value);
    }
  }

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      onKeyDown={handleKeyDown}
      className="inline-flex w-full shrink-0 justify-center rounded-xl border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md sm:w-auto"
    >
      {UNITS.map((item) => {
        const pressed = unit === item.value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              if (node) {
                buttonRefs.current[item.value] = node;
              } else {
                delete buttonRefs.current[item.value];
              }
            }}
            type="button"
            aria-pressed={pressed}
            aria-label={item.name}
            tabIndex={pressed ? 0 : -1}
            onClick={() => select(item.value)}
            className={`min-h-11 min-w-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 sm:flex-none ${
              pressed
                ? 'bg-accent-500 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
