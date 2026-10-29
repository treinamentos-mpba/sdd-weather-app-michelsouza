import { celsiusToFahrenheit, formatTemperature } from '../../../src/lib/temperature.ts';

describe('temperature', () => {
  it('converte e arredonda só na exibição', () => {
    expect(formatTemperature(25, 'fahrenheit')).toBe('77 °F');
    expect(formatTemperature(20.6, 'fahrenheit')).toBe('69 °F');
    expect(formatTemperature(29, 'celsius')).toBe('29 °C');
    expect(celsiusToFahrenheit(25)).toBe(77);
  });
});
