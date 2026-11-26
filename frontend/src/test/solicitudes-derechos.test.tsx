import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SolicitudDerecho, Solicitudes } from '../api/solicitudes-derechos';
import { SolicitudesDerechosPage } from '../pages/admin/SolicitudesDerechosPage';

const SOLICITUD: SolicitudDerecho = {
  id: 'solicitud-1',
  tipo: 'acceso',
  referencia_titular: 'titular-123',
  solicitada_en: '2026-11-20',
  plazo_dias: 15,
  fecha_limite: '2026-12-05',
  dias_restantes: 9,
  vencida: false,
  estado: 'pendiente',
  respuesta: null,
  responsable: { id: 'usuario-1', rol: 'administrador' },
  creado_en: '2026-11-20T10:00:00Z',
  actualizado_en: '2026-11-20T10:00:00Z',
};

const DATOS: Solicitudes = {
  total: 1,
  pendientes: 1,
  vencidas: 0,
  items: [SOLICITUD],
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestAt(index: number): Request {
  const registro = fetchMock.mock.calls[index];
  if (!registro) throw new Error('No se hizo la petición esperada');
  const [recurso, opciones] = registro;
  return recurso instanceof Request ? recurso : new Request(String(recurso), opciones);
}

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>().mockResolvedValue(responder(DATOS));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('solicitudes de derechos', () => {
  it('carga las solicitudes y muestra los contadores', async () => {
    render(<SolicitudesDerechosPage />);

    expect(await screen.findByText('titular-123')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pendientes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vencidas' })).toBeInTheDocument();
    expect(screen.getByText('1', { selector: 'strong' })).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay solicitudes', async () => {
    fetchMock.mockResolvedValue(responder({ total: 0, pendientes: 0, vencidas: 0, items: [] }));

    render(<SolicitudesDerechosPage />);

    expect(await screen.findByText('No hay solicitudes de derechos')).toBeInTheDocument();
  });

  it('registra una solicitud con POST y el cuerpo del formulario', async () => {
    fetchMock
      .mockResolvedValueOnce(responder(DATOS))
      .mockResolvedValueOnce(responder(SOLICITUD, 201))
      .mockResolvedValueOnce(responder(DATOS));
    const user = userEvent.setup();
    render(<SolicitudesDerechosPage />);

    await user.selectOptions(await screen.findByLabelText(/^Tipo de derecho/), 'rectificacion');
    await user.type(screen.getByLabelText(/^Referencia del titular/), 'titular-nuevo');
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const request = requestAt(1);
    expect(request.method).toBe('POST');
    expect(request.url.endsWith('/administrador/solicitudes-derechos')).toBe(true);
    expect(await request.clone().json()).toMatchObject({
      tipo: 'rectificacion',
      referencia_titular: 'titular-nuevo',
      plazo_dias: 15,
    });
    expect(await screen.findByText('La solicitud se registró correctamente.')).toBeInTheDocument();
  });

  it('muestra un error genérico y permite reintentar', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(responder({ detail: 'No revelar información interna' }, 500))
      .mockResolvedValueOnce(responder(DATOS));

    render(<SolicitudesDerechosPage />);

    expect(await screen.findByText(/No se pudieron cargar las solicitudes/)).toBeInTheDocument();
    expect(screen.queryByText('No revelar información interna')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('titular-123')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('cierra una solicitud con PATCH y envía la respuesta', async () => {
    fetchMock
      .mockResolvedValueOnce(responder(DATOS))
      .mockResolvedValueOnce(responder(SOLICITUD))
      .mockResolvedValueOnce(responder(DATOS));
    const user = userEvent.setup();
    render(<SolicitudesDerechosPage />);

    await user.click(await screen.findByRole('button', { name: 'Cerrar' }));
    const dialogo = await screen.findByRole('dialog');
    await user.selectOptions(within(dialogo).getByLabelText(/^Estado final/), 'atendida');
    await user.type(
      within(dialogo).getByLabelText(/^Respuesta/),
      'Solicitud atendida correctamente.',
    );
    await user.click(screen.getByRole('button', { name: 'Guardar cierre' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const request = requestAt(1);
    expect(request.method).toBe('PATCH');
    expect(request.url.endsWith('/administrador/solicitudes-derechos/solicitud-1')).toBe(true);
    expect(await request.clone().json()).toEqual({
      estado: 'atendida',
      respuesta: 'Solicitud atendida correctamente.',
    });
  });
});
