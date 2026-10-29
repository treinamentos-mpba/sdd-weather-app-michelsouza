import {
  celsiusToFahrenheit,
  formatTemperature,
  temperatureUnitLabel,
  toDisplayTemperature,
} from '../../src/lib/temperature.ts';

describe('celsiusToFahrenheit', () => {
  it('converte os pontos de referência sem arredondar', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
});

describe('toDisplayTemperature', () => {
  it('mantém Celsius e converte Fahrenheit a partir do valor original', () => {
    expect(toDisplayTemperature(0, 'celsius')).toBe(0);
    expect(toDisplayTemperature(100, 'celsius')).toBe(100);
    expect(toDisplayTemperature(-40, 'celsius')).toBe(-40);

    expect(toDisplayTemperature(0, 'fahrenheit')).toBe(32);
    expect(toDisplayTemperature(100, 'fahrenheit')).toBe(212);
    expect(toDisplayTemperature(-40, 'fahrenheit')).toBe(-40);
  });

  it('arredonda só o valor exibido', () => {
    expect(toDisplayTemperature(20.6, 'fahrenheit')).toBe(69);
    expect(toDisplayTemperature(20.4, 'celsius')).toBe(20);
    expect(toDisplayTemperature(0.5, 'celsius')).toBe(1);
  });
});

describe('formatTemperature', () => {
  it('arredonda e acrescenta o símbolo da unidade', () => {
    expect(formatTemperature(0, 'fahrenheit')).toBe('32 °F');
    expect(formatTemperature(100, 'fahrenheit')).toBe('212 °F');
    expect(formatTemperature(-40, 'fahrenheit')).toBe('-40 °F');
    expect(formatTemperature(20.6, 'fahrenheit')).toBe('69 °F');
    expect(formatTemperature(20.4, 'celsius')).toBe('20 °C');
    expect(formatTemperature(29, 'celsius')).toBe('29 °C');
  });
});

describe('temperatureUnitLabel', () => {
  it('retorna o símbolo da unidade ativa', () => {
    expect(temperatureUnitLabel('celsius')).toBe('°C');
    expect(temperatureUnitLabel('fahrenheit')).toBe('°F');
  });
});
