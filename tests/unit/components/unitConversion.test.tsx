import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import CurrentWeather from '../../../src/components/CurrentWeather.tsx';
import UnitToggle from '../../../src/components/UnitToggle.tsx';
import type {
  City,
  CurrentWeather as CurrentWeatherData,
  Unit,
} from '../../../src/types/weather.ts';

const city: City = {
  name: 'Salvador',
  country: 'Brasil',
  latitude: -12.97,
  longitude: -38.51,
};

const current: CurrentWeatherData = {
  temperatureC: 0,
  weatherCode: 0,
  description: 'Céu limpo',
  humidity: 50,
  windSpeedKmh: 0,
  precipitationMm: 0,
  pressureHpa: 1013,
};

function TemperatureView() {
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={city} current={current} unit={unit} />
    </>
  );
}

describe('conversão de unidade', () => {
  it('exibe 32 °F ao clicar em Fahrenheit a partir de 0 °C', async () => {
    const user = userEvent.setup();
    render(<TemperatureView />);

    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('0 °C');
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('32 °F');
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(current.temperatureC).toBe(0);
  });

  it('não reconverte um valor que já foi exibido em Fahrenheit', async () => {
    const user = userEvent.setup();
    const fractional = { ...current, temperatureC: 20.6 };

    function View() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather city={city} current={fractional} unit={unit} />
        </>
      );
    }

    render(<View />);
    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('21 °C');

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('69 °F');

    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('21 °C');
    expect(screen.getByRole('region', { name: 'Clima atual' })).not.toHaveTextContent('69');
    expect(fractional.temperatureC).toBe(20.6);
  });
});
