import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnitToggle from '../../../src/components/UnitToggle.tsx';

describe('UnitToggle', () => {
  it('marca a unidade ativa e nomeia o grupo', () => {
    render(<UnitToggle unit="celsius" onChange={() => undefined} />);

    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveTextContent('°C');
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveTextContent('°F');
  });

  it('alterna a unidade uma vez por clique', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    await user.click(screen.getByRole('button', { name: 'Celsius' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('fahrenheit');
  });

  it('navega com as setas e seleciona a outra unidade', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    screen.getByRole('button', { name: 'Celsius' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('fahrenheit');
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveFocus();
  });
});
