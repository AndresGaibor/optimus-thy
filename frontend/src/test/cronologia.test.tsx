import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { obtenerCronologia } from '../api/cronologia';
import { CronologiaCaso } from '../pages/medico/CronologiaCaso';

vi.mock('../api/cronologia', () => ({ obtenerCronologia: vi.fn() }));
const obtener = vi.mocked(obtenerCronologia);

afterEach(() => vi.clearAllMocks());

describe('cronología del caso', () => {
  it('muestra los hitos cargados y fechas en es-EC', async () => {
    obtener.mockResolvedValue([
      {
        tipo: 'imagen',
        ocurrido_en: '2026-11-20T10:00:00Z',
        titulo: 'Imagen agregada',
        detalle: null,
        actor: null,
      },
    ]);

    render(<CronologiaCaso casoId="caso-1" />);

    expect(screen.getByText('Cargando la cronología')).toBeInTheDocument();
    expect(await screen.findByText('Imagen agregada')).toBeInTheDocument();
    expect(obtener).toHaveBeenCalledWith('caso-1');
  });

  it('muestra el estado vacío', async () => {
    obtener.mockResolvedValue([]);
    render(<CronologiaCaso casoId="caso-1" />);
    expect(await screen.findByText('Aún no hay hitos')).toBeInTheDocument();
  });

  it('permite reintentar cuando falla la carga', async () => {
    obtener.mockRejectedValueOnce(new Error('fallo')).mockResolvedValueOnce([]);
    render(<CronologiaCaso casoId="caso-1" />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Aún no hay hitos')).toBeInTheDocument();
  });
});
