import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EstadoFicha, VersionFicha } from '../api/fichas';
import {
  cerrarFicha,
  obtenerEstadoFicha,
  obtenerHistorialFicha,
  reabrirFicha,
} from '../api/fichas';
import { FichaCasoPanel } from '../pages/medico/FichaCasoPanel';

vi.mock('../api/fichas', () => ({
  cerrarFicha: vi.fn(),
  obtenerEstadoFicha: vi.fn(),
  obtenerHistorialFicha: vi.fn(),
  reabrirFicha: vi.fn(),
}));

const obtenerEstado = vi.mocked(obtenerEstadoFicha);
const obtenerHistorial = vi.mocked(obtenerHistorialFicha);
const cerrar = vi.mocked(cerrarFicha);
const reabrir = vi.mocked(reabrirFicha);

const abierta: EstadoFicha = {
  caso_id: 'caso-1',
  registrada: true,
  cerrada_en: null,
  cerrada_por_id: null,
  cerrada_por_nombre: null,
};
const cerrada: EstadoFicha = {
  caso_id: 'caso-1',
  registrada: true,
  cerrada_en: '2026-11-20T10:00:00Z',
  cerrada_por_id: 'usuario-1',
  cerrada_por_nombre: 'Equipo médico',
};
const versiones: VersionFicha[] = [
  {
    version: 2,
    creado_en: '2026-11-20T10:00:00Z',
    autor_id: 'usuario-1',
    autor_nombre: 'Equipo médico',
    campos_cambiados: ['tirads'],
    antes: { tirads: 'TR3' },
    despues: { tirads: 'TR4' },
  },
];

let estadoActual = abierta;

afterEach(() => vi.clearAllMocks());

beforeEach(() => {
  estadoActual = abierta;
  obtenerEstado.mockImplementation(async () => estadoActual);
  obtenerHistorial.mockResolvedValue(versiones);
  cerrar.mockImplementation(async () => {
    estadoActual = cerrada;
    return cerrada;
  });
  reabrir.mockImplementation(async () => {
    estadoActual = abierta;
    return abierta;
  });
});

describe('panel de ficha del caso', () => {
  it('muestra autoría y valores anteriores y posteriores', async () => {
    render(<FichaCasoPanel casoId="caso-1" />);

    expect(await screen.findByText('Versión 2 · Equipo médico')).toBeInTheDocument();
    expect(screen.getByText('tirads: TR3 → TR4')).toBeInTheDocument();
    expect(obtenerHistorial).toHaveBeenCalledWith('caso-1');
  });

  it('confirma el cierre antes de solicitarlo y refresca el estado', async () => {
    const user = userEvent.setup();
    render(<FichaCasoPanel casoId="caso-1" />);

    await user.click(await screen.findByRole('button', { name: 'Cerrar ficha' }));
    expect(screen.getByRole('dialog', { name: 'Cerrar ficha clínica' })).toBeInTheDocument();
    expect(cerrar).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmar cierre' }));

    await waitFor(() => expect(cerrar).toHaveBeenCalledWith('caso-1'));
    expect(await screen.findByText(/Ficha cerrada/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Reabrir ficha' })).toBeInTheDocument();
  });

  it('permite cancelar la confirmación sin cambiar el estado', async () => {
    const user = userEvent.setup();
    render(<FichaCasoPanel casoId="caso-1" />);

    await user.click(await screen.findByRole('button', { name: 'Cerrar ficha' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(cerrar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirma la reapertura de una ficha cerrada', async () => {
    estadoActual = cerrada;
    const user = userEvent.setup();
    render(<FichaCasoPanel casoId="caso-1" />);

    await user.click(await screen.findByRole('button', { name: 'Reabrir ficha' }));
    expect(screen.getByRole('dialog', { name: 'Reabrir ficha clínica' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar reapertura' }));

    await waitFor(() => expect(reabrir).toHaveBeenCalledWith('caso-1'));
    expect(await screen.findByRole('button', { name: 'Cerrar ficha' })).toBeInTheDocument();
  });
});
