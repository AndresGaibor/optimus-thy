import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { crearCohorte, listarCohortes } from '../api/cohortes';
import { CohortesPage } from '../pages/investigador/CohortesPage';

vi.mock('../api/cohortes', () => ({
  borrarCohorte: vi.fn(),
  crearCohorte: vi.fn(),
  listarCohortes: vi.fn(),
}));

const listar = vi.mocked(listarCohortes);
const crear = vi.mocked(crearCohorte);
const cohorte = {
  id: 'cohorte-1',
  nombre: 'TIRADS 4',
  filtros: { tirads: '4' },
  total_casos: 2,
  creado_en: '2026-11-26T10:00:00Z',
  actualizado_en: '2026-11-26T10:00:00Z',
};

afterEach(() => vi.clearAllMocks());

describe('cohortes de investigación', () => {
  it('lista y crea una cohorte con filtros reales', async () => {
    listar.mockResolvedValue({ ok: true, data: { total: 1, items: [cohorte] } });
    crear.mockResolvedValue({ ok: true, data: { ...cohorte, nombre: 'Mi cohorte' } });
    render(
      <MemoryRouter>
        <CohortesPage />
      </MemoryRouter>,
    );

    expect(await screen.findAllByText('TIRADS 4')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Mi cohorte' } });
    fireEvent.change(screen.getByLabelText('TIRADS'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cohorte' }));

    expect(await screen.findAllByText('Mi cohorte')).toHaveLength(2);
    expect(crear).toHaveBeenCalledWith('Mi cohorte', { tirads: '4' });
  });

  it('permite reintentar tras un error de listado', async () => {
    listar
      .mockResolvedValueOnce({ ok: false, error: 'No se pudieron cargar las cohortes.' })
      .mockResolvedValueOnce({ ok: true, data: { total: 1, items: [cohorte] } });

    render(
      <MemoryRouter>
        <CohortesPage />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText('TIRADS 4')).toHaveLength(2);
  });
});
