import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecuperacionPage } from '../pages/RecuperacionPage';

interface FetchMock {
  mock: { calls: unknown[][] };
  mockResolvedValueOnce: (value: unknown) => unknown;
}

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login/recuperar" element={<RecuperacionPage />} />
        <Route path="/restablecer/:token" element={<RecuperacionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('recuperación de contraseña', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn(() =>
      Promise.resolve(responderJson({ ok: true }, 202)),
    ) as unknown as FetchMock;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('envía la solicitud y no revela si la cuenta existe', async () => {
    const usuario = userEvent.setup();
    montar('/login/recuperar');

    await usuario.type(screen.getByLabelText(/correo electrónico/i), 'quien.sea@example.test');
    await usuario.click(screen.getByRole('button', { name: /enviar enlace/i }));

    expect(await screen.findByText(/solicitud recibida/i)).toBeInTheDocument();
    expect(screen.getByText(/si el correo pertenece a una cuenta activa/i)).toBeInTheDocument();

    const [llamada] = fetchMock.mock.calls;
    expect(String(llamada?.[0] instanceof Request ? llamada[0].url : llamada?.[0])).toContain(
      '/auth/recuperacion',
    );
  });

  it('valida en el navegador que la contraseña se repita y tenga 12 caracteres', async () => {
    const usuario = userEvent.setup();
    montar('/restablecer/token-de-prueba');

    await usuario.type(screen.getByLabelText(/contraseña nueva/i), 'corta');
    await usuario.type(screen.getByLabelText(/repetir contraseña/i), 'corta');
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/usa al menos 12 caracteres/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it('avisa cuando el enlace ya no vale', async () => {
    const usuario = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      responderJson({ error: { code: 'token_invalido', message: 'Venció.' } }, 400),
    );
    montar('/restablecer/token-vencido');

    await usuario.type(screen.getByLabelText(/contraseña nueva/i), 'nuevaClave-987');
    await usuario.type(screen.getByLabelText(/repetir contraseña/i), 'nuevaClave-987');
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/enlace no válido/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solicitar otro enlace/i })).toBeInTheDocument();
  });

  it('confirma el cambio y avisa del cierre de sesiones', async () => {
    const usuario = userEvent.setup();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    montar('/restablecer/token-valido');

    await usuario.type(screen.getByLabelText(/contraseña nueva/i), 'nuevaClave-987');
    await usuario.type(screen.getByLabelText(/repetir contraseña/i), 'nuevaClave-987');
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument();
    expect(screen.getByText(/cerramos las sesiones/i)).toBeInTheDocument();
  });

  it('no confirma si las contraseñas no coinciden', async () => {
    const usuario = userEvent.setup();
    montar('/restablecer/token-valido');

    await usuario.type(screen.getByLabelText(/contraseña nueva/i), 'nuevaClave-987');
    await usuario.type(screen.getByLabelText(/repetir contraseña/i), 'otraClave-987');
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls).toHaveLength(0);
  });
});
