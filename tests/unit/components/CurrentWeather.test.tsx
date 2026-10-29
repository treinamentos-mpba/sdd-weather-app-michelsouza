import { render, screen } from '@testing-library/react';
import CurrentWeather from '../../../src/components/CurrentWeather.tsx';
import { mockWeatherData } from '../../../src/mocks/weather.ts';

const current = mockWeatherData.current.status === 'success' ? mockWeatherData.current.data : null;

describe('CurrentWeather', () => {
  it('mostra a cidade, a condição e as métricas na unidade atual', () => {
    if (!current) {
      throw new Error('mock sem clima atual');
    }

    render(<CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Clima atual' })).toBeInTheDocument();
    expect(screen.getByText('Salvador, Bahia, Brasil')).toBeInTheDocument();
    expect(screen.getByText('29 °C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('14 km/h')).toBeInTheDocument();
    expect(screen.getByText('0,2 mm')).toBeInTheDocument();
    expect(screen.getByText('1.013 hPa')).toBeInTheDocument();
  });

  it('deriva Fahrenheit na renderização sem alterar o Celsius original', () => {
    if (!current) {
      throw new Error('mock sem clima atual');
    }

    render(<CurrentWeather city={mockWeatherData.city} current={current} unit="fahrenheit" />);

    expect(screen.getByText('84 °F')).toBeInTheDocument();
    expect(current.temperatureC).toBe(29);
  });

  it('mostra traço quando a medição veio ausente e zero na precipitação', () => {
    render(
      <CurrentWeather
        city={{ name: 'Salvador', country: '—', latitude: -12.97, longitude: -38.51 }}
        current={{
          temperatureC: null,
          weatherCode: null,
          description: 'Condição desconhecida',
          humidity: null,
          windSpeedKmh: null,
          precipitationMm: 0,
          pressureHpa: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Salvador, —')).toBeInTheDocument();
    expect(screen.getByText('Condição desconhecida')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/NaN|undefined/)).not.toBeInTheDocument();
  });
});
