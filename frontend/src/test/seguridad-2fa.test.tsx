import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeguridadSegundoFactor } from '../pages/perfil/SeguridadSegundoFactor';

const SECRETO = 'JBSWY3DP' + 'EHPK3PXP';
const URL_OTP = `otpauth://totp/OPTIMUS-THY:ana?secret=${SECRETO}`;
const CONTRASENA = 'ClaveActual' + '-2026';
const CODIGOS = ['AABBCC0011', 'DDEEFF2233'] as const;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('seguridad del segundo factor', () => {
  let activo: boolean;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    activo = false;
    fetchMock = vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = entrada instanceof Request ? entrada.url : String(entrada);
      const method = entrada instanceof Request ? entrada.method : (init?.method ?? 'GET');
      if (url.includes('/auth/me')) return Promise.resolve(json({ segundo_factor_activo: activo }));
      if (url.includes('/auth/2fa/iniciar'))
        return Promise.resolve(json({ secreto: SECRETO, uri: URL_OTP }));
      if (url.includes('/auth/2fa/confirmar')) {
        activo = true;
        return Promise.resolve(
          json({ segundo_factor_activo: true, codigos_recuperacion: CODIGOS }),
        );
      }
      if (url.includes('/auth/2fa/desactivar') && method === 'POST') {
        activo = false;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(json({ error: { code: 'unauthorized' } }, 401));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('activa con secreto y enlace, muestra códigos una vez y limpia secretos al cerrar', async () => {
    const usuario = userEvent.setup();
    render(<SeguridadSegundoFactor />);
    await screen.findByText('Estado: Desactivado');
    await usuario.click(screen.getByRole('button', { name: 'Activar segundo factor' }));
    expect(await screen.findByText(SECRETO)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir enlace otpauth' })).toHaveAttribute(
      'href',
      URL_OTP,
    );
    await usuario.type(screen.getByLabelText(/código de seis dígitos/i), '123456');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar y activar' }));
    expect(await screen.findByText(CODIGOS[0])).toBeInTheDocument();
    expect(screen.queryByText(SECRETO)).not.toBeInTheDocument();
    expect(screen.getByText('Estado: Activado')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByText(CODIGOS[0])).not.toBeInTheDocument());
    expect(document.body).not.toHaveTextContent(SECRETO);
    expect(document.body).not.toHaveTextContent(URL_OTP);
  });

  it('desactiva únicamente después de enviar la contraseña actual', async () => {
    const usuario = userEvent.setup();
    activo = true;
    render(<SeguridadSegundoFactor />);
    await screen.findByText('Estado: Activado');
    await usuario.type(screen.getByLabelText(/contraseña actual/i), CONTRASENA);
    await usuario.click(screen.getByRole('button', { name: 'Desactivar segundo factor' }));
    await screen.findByText('Estado: Desactivado');
    const llamada = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/auth/2fa/desactivar'),
    );
    expect(llamada).toBeDefined();
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({ password: CONTRASENA });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Los códigos de recuperación anteriores ya no sirven',
    );
  });
});
