import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../../../src/components/states/EmptyState.tsx';
import ErrorState from '../../../src/components/states/ErrorState.tsx';
import LoadingState from '../../../src/components/states/LoadingState.tsx';

describe('estados da interface', () => {
  it('anuncia o carregamento', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
  });

  it('mostra a mensagem de erro e chama onRetry uma vez', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState message="Não foi possível consultar o clima." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar o clima.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('mostra título e dica no estado vazio', () => {
    render(
      <EmptyState
        title="Nenhuma cidade encontrada"
        hint="Revise o texto digitado e tente outro nome."
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
    expect(screen.getByText('Revise o texto digitado e tente outro nome.')).toBeInTheDocument();
  });
});
