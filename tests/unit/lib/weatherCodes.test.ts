import { getWeatherDescription, getWeatherIcon } from '../../../src/lib/weatherCodes.ts';

describe('weatherCodes', () => {
  it('mapeia um código WMO conhecido para ícone e descrição', () => {
    expect(getWeatherIcon(0)).toBe('☀️');
    expect(getWeatherDescription(0)).toBe('Céu limpo');
    expect(getWeatherIcon(61)).toBe('🌧️');
    expect(getWeatherDescription(61)).toBe('Chuva fraca');
    expect(getWeatherIcon(95)).toBe('⛈️');
    expect(getWeatherDescription(95)).toBe('Trovoada');
  });

  it('usa fallback quando o código é desconhecido', () => {
    expect(getWeatherIcon(123)).toBe('🌡️');
    expect(getWeatherDescription(123)).toBe('Condição desconhecida');
    expect(getWeatherIcon(-1)).toBe('🌡️');
    expect(getWeatherDescription(-1)).toBe('Condição desconhecida');
  });
});
