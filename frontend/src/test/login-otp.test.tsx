import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../pages/LoginPage';
import { SessionProvider } from '../session/SessionContext';

const SESION = {
  usuario: { id: '1', correo: 'ana@hospital.test', nombre: 'Ana Pérez' },
  roles: ['doctor'],
  rol_activo: 'doctor',
  segundo_factor_activo: true,
};

type Responder = (url: string, init?: RequestInit) => Response;
type FetchMock = { mock: { calls: unknown[][] } };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('login con segundo factor', () => {
  let responder: Responder;
  let fetchMock: FetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    responder = (url) =>
      url.includes('/auth/me') ? json({ error: { code: 'unauthorized' } }, 401) : json({});
    fetchMock = vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = entrada instanceof Request ? entrada.url : String(entrada);
      return Promise.resolve(responder(url, init));
    }) as unknown as FetchMock;
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  });

  async function iniciarDesafio(usuario: UserEvent) {
    await usuario.type(screen.getByLabelText(/correo electrónico/i), 'ana@hospital.test');
    await usuario.type(screen.getByLabelText(/contraseña/i), 'ClaveSegura-2026');
    responder = (url) =>
      url.includes('/auth/login')
        ? json({ requiere_otp: true, desafio: 'desafio-test', segundos_para_expirar: 300 }, 202)
        : url.includes('/auth/me')
          ? json({ error: { code: 'unauthorized' } }, 401)
          : json({});
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('heading', { name: 'Verifica tu identidad' });
  }

  it('verifica un código TOTP correcto', async () => {
    const usuario = userEvent.setup();
    montar();
    await iniciarDesafio(usuario);
    responder = (url) =>
      url.includes('/auth/login/otp')
        ? json(SESION)
        : json({ error: { code: 'unauthorized' } }, 401);
    await usuario.type(screen.getByLabelText(/código de seis dígitos/i), '123456');
    await usuario.click(screen.getByRole('button', { name: 'Verificar código' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/auth/login/otp'))).toBe(
        true,
      ),
    );
    await screen.findByRole('heading', { name: 'Iniciar sesión' });
  });

  it('explica el código inválido sin exponer detalles del servidor', async () => {
    const usuario = userEvent.setup();
    montar();
    await iniciarDesafio(usuario);
    responder = (url) =>
      url.includes('/auth/login/otp')
        ? json({ error: { code: 'codigo_invalido', message: 'detalle interno' } }, 401)
        : json({ error: { code: 'unauthorized' } }, 401);
    await usuario.type(screen.getByLabelText(/código de seis dígitos/i), '000000');
    await usuario.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El código no es válido');
    expect(screen.queryByText('detalle interno')).not.toBeInTheDocument();
  });

  it('informa que un código de recuperación ya se utilizó', async () => {
    const usuario = userEvent.setup();
    montar();
    await iniciarDesafio(usuario);
    responder = (url) =>
      url.includes('/auth/login/otp')
        ? json({ error: { code: 'codigo_invalido' } }, 401)
        : json({ error: { code: 'unauthorized' } }, 401);
    await usuario.click(screen.getByRole('button', { name: 'Usar un código de recuperación' }));
    await usuario.type(screen.getByLabelText(/código de recuperación/i), 'A1B2C3D4');
    await usuario.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no es válido o ya se utilizó');
  });
});
