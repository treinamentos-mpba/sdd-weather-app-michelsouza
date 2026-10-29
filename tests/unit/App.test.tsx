import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.tsx';
import { mockWeatherData } from '../../src/mocks/weather.ts';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService.ts';
import type { City } from '../../src/types/weather.ts';

vi.mock('../../src/services/weatherService.ts', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/weatherService.ts')>(
    '../../src/services/weatherService.ts',
  );
  return {
    ...actual,
    searchCities: vi.fn(),
    getWeather: vi.fn(),
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(searchCities).mockReset();
    vi.mocked(getWeather).mockReset();
  });

  it('começa em idle e chega ao sucesso sem converter o dado armazenado', async () => {
    const user = userEvent.setup();
    const pendingCities = deferred<City[]>();
    vi.mocked(searchCities).mockImplementation(() => pendingCities.promise);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Pesquise uma cidade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clima' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Buscar cidade' }), 'Salvador');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Consultando o clima...');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();

    await act(async () => {
      pendingCities.resolve([mockWeatherData.city]);
    });

    const current = await screen.findByRole('region', { name: 'Clima atual' });
    expect(current).toHaveTextContent('29 °C');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Salvador, Bahia, Brasil' })).toHaveFocus();
    });

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(current).toHaveTextContent('84 °F');
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('alterna para vazio e erro e o retry refaz a busca', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Buscar cidade' }), 'Lisboa');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();

    vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await user.clear(screen.getByRole('textbox', { name: 'Buscar cidade' }));
    await user.type(screen.getByRole('textbox', { name: 'Buscar cidade' }), 'erro');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');

    vi.mocked(searchCities).mockResolvedValueOnce([mockWeatherData.city]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('region', { name: 'Clima atual' })).toHaveTextContent('29 °C');
    expect(searchCities).toHaveBeenLastCalledWith('erro');
  });

  it('aplica a unidade escolhida durante o loading sem nova consulta', async () => {
    const user = userEvent.setup();
    const pendingCities = deferred<City[]>();
    vi.mocked(searchCities).mockImplementation(() => pendingCities.promise);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Buscar cidade' }), 'Salvador');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Consultando o clima...');

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByRole('status')).toHaveTextContent('Consultando o clima...');
    expect(getWeather).not.toHaveBeenCalled();

    await act(async () => {
      pendingCities.resolve([mockWeatherData.city]);
    });

    expect(await screen.findByRole('region', { name: 'Clima atual' })).toHaveTextContent('84 °F');
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('mostra a previsão parcial e volta a Celsius sem reconverter o valor', async () => {
    const user = userEvent.setup();
    const days =
      mockWeatherData.daily.status === 'success' ? mockWeatherData.daily.data.days.slice(0, 2) : [];
    vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city]);
    vi.mocked(getWeather).mockResolvedValue({
      ...mockWeatherData,
      daily: { status: 'success', data: { days, isPartial: true } },
    });
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Buscar cidade' }), 'Salvador');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('region', { name: 'Clima atual' })).toHaveTextContent('29 °C');
    expect(screen.getByRole('status')).toHaveTextContent('apenas 2 dias');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: 'Previsão de 5 dias' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('84 °F');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('88 °F');

    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(screen.getByRole('region', { name: 'Clima atual' })).toHaveTextContent('29 °C');
    expect(screen.getByRole('region', { name: 'Clima atual' })).not.toHaveTextContent('84');
    expect(getWeather).toHaveBeenCalledTimes(1);
  });
});
