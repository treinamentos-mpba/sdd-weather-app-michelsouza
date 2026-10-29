import type { City, WeatherData } from '../types/weather.ts';

/** Cenário fixo para desenvolver a UI sem consultar a Open-Meteo. */
export type MockWeatherData = WeatherData & {
  city: City;
};

/** Salvador com clima atual e cinco dias, ambos em sucesso. Temperaturas em Celsius. */
export const mockWeatherData: MockWeatherData = {
  city: {
    name: 'Salvador',
    country: 'Brasil',
    region: 'Bahia',
    latitude: -12.97111,
    longitude: -38.51083,
  },
  fetchedAt: new Date('2026-10-29T15:30:00.000-03:00'),
  current: {
    status: 'success',
    data: {
      temperatureC: 29,
      weatherCode: 2,
      description: 'Parcialmente nublado',
      humidity: 78,
      windSpeedKmh: 14,
      precipitationMm: 0.2,
      pressureHpa: 1013,
    },
  },
  daily: {
    status: 'success',
    data: {
      isPartial: false,
      days: [
        {
          date: '2026-10-29',
          maxTemperatureC: 31,
          minTemperatureC: 24,
          weatherCode: 2,
          description: 'Parcialmente nublado',
          precipitationProbability: 20,
        },
        {
          date: '2026-10-30',
          maxTemperatureC: 30,
          minTemperatureC: 23,
          weatherCode: 1,
          description: 'Predominantemente limpo',
          precipitationProbability: 10,
        },
        {
          date: '2026-10-31',
          maxTemperatureC: 29,
          minTemperatureC: 24,
          weatherCode: 3,
          description: 'Nublado',
          precipitationProbability: 40,
        },
        {
          date: '2026-11-01',
          maxTemperatureC: 28,
          minTemperatureC: 23,
          weatherCode: 61,
          description: 'Chuva fraca',
          precipitationProbability: 80,
        },
        {
          date: '2026-11-02',
          maxTemperatureC: 30,
          minTemperatureC: 24,
          weatherCode: 0,
          description: 'Céu limpo',
          precipitationProbability: 5,
        },
      ],
    },
  },
};
