import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { obtenerTablero, type TableroAdministrador } from '../api/tablero';
import { TableroPage } from '../pages/admin/TableroPage';

vi.mock('../api/tablero', () => ({ obtenerTablero: vi.fn() }));
const obtener = vi.mocked(obtenerTablero);
const datos: TableroAdministrador = {
  volumen: { pacientes: 3, casos: 2, imagenes: 4, inferencias: 1, usuarios: 5 },
  actividad: [{ accion: 'AUTH.SESSION_START', total: 2, ultima: '2026-11-25T10:00:00Z' }],
  servicios: [
    { nombre: 'base_datos', estado: 'ok' },
    { nombre: 'servicio_ia', estado: 'degradado' },
    { nombre: 'almacenamiento', estado: 'ok' },
  ],
};

afterEach(() => vi.clearAllMocks());

describe('tablero del administrador', () => {
  it('muestra volumen, actividad y servicios reales', async () => {
    obtener.mockResolvedValue(datos);
    render(<TableroPage />);

    expect(screen.getByText('Cargando el tablero')).toBeInTheDocument();
    expect(await screen.findByText('AUTH.SESSION_START')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Servicio de IA')).toBeInTheDocument();
    expect(screen.getByText('Degradado')).toBeInTheDocument();
  });

  it('permite reintentar cuando falla la carga', async () => {
    obtener.mockRejectedValueOnce(new Error('fallo')).mockResolvedValueOnce(datos);
    render(<TableroPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('AUTH.SESSION_START')).toBeInTheDocument();
  });
});
