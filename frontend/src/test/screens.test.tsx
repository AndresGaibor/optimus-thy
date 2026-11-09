import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorScreen } from '../components/ErrorScreen';
import { LoadingScreen } from '../components/LoadingScreen';

describe('LoadingScreen', () => {
  it('se anuncia como estado polite', () => {
    render(<LoadingScreen />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Cargando…');
  });
});

describe('ErrorScreen', () => {
  it('se anuncia como alerta sin mostrar detalles internos', () => {
    render(<ErrorScreen onReintentar={() => undefined} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).not.toMatch(/stack|Traceback|SELECT|at /i);
  });

  it('el botón Reintentar llama al manejador', async () => {
    const onReintentar = vi.fn();
    const user = userEvent.setup();
    render(<ErrorScreen onReintentar={onReintentar} />);
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onReintentar).toHaveBeenCalledOnce();
  });
});
