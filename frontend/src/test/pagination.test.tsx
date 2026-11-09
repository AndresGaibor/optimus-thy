import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '../design-system';

describe('Pagination (HT-021)', () => {
  it('en la primera página no deja ir hacia atrás', () => {
    render(<Pagination total={60} limit={25} offset={0} onOffsetChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('en la última página no deja ir hacia adelante', () => {
    render(<Pagination total={60} limit={25} offset={50} onOffsetChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
  });

  it('avanza y retrocede de limit en limit sin bajar de cero', async () => {
    const user = userEvent.setup();
    const cambiar = vi.fn();
    render(<Pagination total={60} limit={25} offset={25} onOffsetChange={cambiar} />);
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(cambiar).toHaveBeenNthCalledWith(1, 50);
    expect(cambiar).toHaveBeenNthCalledWith(2, 0);
  });

  it('sin resultados muestra una sola página y ambos botones inactivos', () => {
    render(
      <Pagination total={0} limit={25} offset={0} onOffsetChange={() => {}} itemLabel="usuario" />,
    );
    expect(screen.getByText('Total: 0 usuarios')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('el singular no lleva «s» y la región se anuncia como navegación', () => {
    render(
      <Pagination total={1} limit={25} offset={0} onOffsetChange={() => {}} itemLabel="usuario" />,
    );
    expect(screen.getByText('Total: 1 usuario')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument();
  });
});
