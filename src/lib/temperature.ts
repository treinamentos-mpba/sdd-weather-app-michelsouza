import type { Unit } from '../types/weather.ts';

/** Converte Celsius para Fahrenheit sem arredondar. */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/** Arredonda para o inteiro mais próximo, só na apresentação. */
export function roundTemperature(value: number): number {
  return Math.round(value);
}

/** Valor exibido na unidade ativa, sempre derivado do Celsius original. */
export function toDisplayTemperature(celsius: number, unit: Unit): number {
  const value = unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
  return roundTemperature(value);
}

export function temperatureUnitLabel(unit: Unit): '°C' | '°F' {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

/** Ex.: 25 °C → "77 °F"; 20,6 °C → "69 °F". */
export function formatTemperature(celsius: number, unit: Unit): string {
  return `${toDisplayTemperature(celsius, unit)} ${temperatureUnitLabel(unit)}`;
}
