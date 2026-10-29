import { render, screen } from '@testing-library/react';
import ForecastList from '../../../src/components/ForecastList.tsx';
import { mockWeatherData } from '../../../src/mocks/weather.ts';

const days = mockWeatherData.daily.status === 'success' ? mockWeatherData.daily.data.days : [];

describe('ForecastList', () => {
  it('mostra cinco cards com rótulo, temperaturas e chance de chuva', () => {
    render(<ForecastList days={days} unit="celsius" />);

    const list = screen.getByRole('list');
    expect(list).toHaveClass('grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-5');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('article', { name: 'qui, 29/10' })).toHaveTextContent('31 °C');
    expect(screen.getByRole('article', { name: 'qui, 29/10' })).toHaveTextContent('24 °C');
    expect(screen.getByRole('article', { name: 'qui, 29/10' })).toHaveTextContent('Chuva 20%');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('converte máxima e mínima na renderização', () => {
    render(<ForecastList days={days.slice(0, 1)} unit="fahrenheit" />);

    expect(screen.getByRole('article', { name: 'qui, 29/10' })).toHaveTextContent('88 °F');
    expect(screen.getByRole('article', { name: 'qui, 29/10' })).toHaveTextContent('75 °F');
  });

  it('avisa previsão incompleta sem inventar dias', () => {
    render(<ForecastList days={days.slice(0, 1)} unit="celsius" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('apenas 1 dia disponível');
  });
});
