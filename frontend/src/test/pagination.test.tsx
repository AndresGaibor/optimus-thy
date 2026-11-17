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

  it('sin resultados no muestra controles de navegación', () => {
    render(
      <Pagination total={0} limit={25} offset={0} onOffsetChange={() => {}} itemLabel="usuario" />,
    );
    expect(screen.getByText('Sin usuarios')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('con una sola página solo muestra el rango y no los controles', () => {
    render(
      <Pagination total={1} limit={25} offset={0} onOffsetChange={() => {}} itemLabel="usuario" />,
    );
    expect(screen.getByText('Mostrando 1 de 1 usuario')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument();
  });

  it('muestra el rango visible sobre el total filtrado', () => {
    render(
      <Pagination
        total={60}
        limit={25}
        offset={25}
        onOffsetChange={() => {}}
        itemLabel="usuario"
      />,
    );
    expect(screen.getByText('Mostrando 26–50 de 60 usuarios')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });
});
