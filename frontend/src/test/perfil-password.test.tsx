import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PerfilPage } from '../pages/PerfilPage';
import { SessionProvider } from '../session/SessionContext';

const SESION = {
  usuario: { id: '1', correo: 'ana@hospital.test', nombre: 'Ana Pérez' },
  roles: ['doctor'],
  rol_activo: 'doctor',
  segundos_para_expirar: 600,
};

const CLAVE_ACTUAL = 'ClaveActual-2026';
const CLAVE_NUEVA = 'ClaveNueva-2026!';
// Valor que el servidor rechaza: no es la contraseña de la cuenta.
const CLAVE_ERRONEA = 'no-es-la-actual';

interface FetchMock {
  mock: { calls: unknown[][] };
}

type Respondedor = () => Promise<Response>;

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function urlDe(call: unknown[]): string {
  const entrada = call[0];
  if (entrada instanceof Request) return entrada.url;
  return String(entrada);
}

function metodoDe(call: unknown[]): string | undefined {
  const entrada = call[0];
  if (entrada instanceof Request) return entrada.method;
  const opciones = call[1];
  if (opciones && typeof opciones === 'object' && 'method' in opciones) {
    const metodo = opciones.method;
    return typeof metodo === 'string' ? metodo : undefined;
  }
  return undefined;
}

function cuerpoDeOpciones(call: unknown[]): string | undefined {
  const opciones = call[1];
  if (opciones && typeof opciones === 'object' && 'body' in opciones) {
    const cuerpo = opciones.body;
    return typeof cuerpo === 'string' ? cuerpo : undefined;
  }
  return undefined;
}

function montar() {
  return render(
    <MemoryRouter>
      <SessionProvider>
        <PerfilPage />
      </SessionProvider>
    </MemoryRouter>,
  );
}

async function cuerpoDePassword(fetchMock: FetchMock): Promise<unknown> {
  const call = fetchMock.mock.calls.find(
    (llamada) => urlDe(llamada).includes('/auth/password') && metodoDe(llamada) === 'PUT',
  );
  expect(call).toBeDefined();
  const entrada = call?.[0];
  if (entrada instanceof Request) {
    return JSON.parse(await entrada.clone().text());
  }
  const cuerpo = call ? cuerpoDeOpciones(call) : undefined;
  expect(cuerpo).toBeDefined();
  return JSON.parse(cuerpo ?? '');
}

function llamadasDePassword(fetchMock: FetchMock): unknown[][] {
  return fetchMock.mock.calls.filter(
    (llamada) => urlDe(llamada).includes('/auth/password') && metodoDe(llamada) === 'PUT',
  );
}

async function rellenar(usuario: UserEvent, actual: string, nueva: string, repeticion: string) {
  await usuario.type(screen.getByLabelText(/^contraseña actual/i), actual);
  await usuario.type(screen.getByLabelText(/^contraseña nueva/i), nueva);
  await usuario.type(screen.getByLabelText(/^repetir contraseña nueva/i), repeticion);
}

describe('perfil: cambio de contraseña', () => {
  let fetchMock: FetchMock;
  let responderPassword: Respondedor;

  beforeEach(() => {
    vi.restoreAllMocks();
    responderPassword = () => Promise.resolve(new Response(null, { status: 204 }));
    fetchMock = vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = entrada instanceof Request ? entrada.url : String(entrada);
      const metodo = entrada instanceof Request ? entrada.method : init?.method;
      if (url.includes('/auth/me')) {
        return Promise.resolve(responderJson(SESION));
      }
      if (url.includes('/auth/password') && metodo === 'PUT') {
        return responderPassword();
      }
      return Promise.resolve(responderJson({ ok: true }));
    }) as unknown as FetchMock;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('valida los campos vacíos con un mensaje por campo y no llama a la API', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByRole('heading', { name: /mi perfil/i });

    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/escribe tu contraseña actual/i)).toBeInTheDocument();
    expect(screen.getByText(/escribe una contraseña nueva/i)).toBeInTheDocument();
    expect(screen.getByText(/repite la contraseña nueva/i)).toBeInTheDocument();
    expect(llamadasDePassword(fetchMock)).toHaveLength(0);
  });

  it('rechaza contraseñas nuevas de menos de 12 caracteres', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByRole('heading', { name: /mi perfil/i });

    await rellenar(usuario, CLAVE_ACTUAL, 'corta', 'corta');
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/usa al menos 12 caracteres/i)).toBeInTheDocument();
    expect(llamadasDePassword(fetchMock)).toHaveLength(0);
  });

  it('no envía nada cuando la repetición no coincide', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByRole('heading', { name: /mi perfil/i });

    await rellenar(usuario, CLAVE_ACTUAL, CLAVE_NUEVA, 'OtraClave-2026!');
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(llamadasDePassword(fetchMock)).toHaveLength(0);
  });

  it('muestra el error de contraseña actual en su campo', async () => {
    const usuario = userEvent.setup();
    responderPassword = () =>
      Promise.resolve(
        responderJson(
          {
            error: {
              code: 'password_actual_incorrecta',
              message: 'La contraseña actual no es correcta.',
            },
          },
          400,
        ),
      );
    montar();
    await screen.findByRole('heading', { name: /mi perfil/i });

    await rellenar(usuario, CLAVE_ERRONEA, CLAVE_NUEVA, CLAVE_NUEVA);
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/la contraseña actual no es correcta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña actual/i)).toHaveAttribute('aria-invalid', 'true');
    expect(await cuerpoDePassword(fetchMock)).toEqual({
      password_actual: CLAVE_ERRONEA,
      password_nueva: CLAVE_NUEVA,
    });
  });

  it('confirma el cambio y avisa del cierre de las demás sesiones', async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByRole('heading', { name: /mi perfil/i });

    await rellenar(usuario, CLAVE_ACTUAL, CLAVE_NUEVA, CLAVE_NUEVA);
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument();
    expect(screen.getByText(/las demás sesiones se cerraron/i)).toBeInTheDocument();
    expect(await cuerpoDePassword(fetchMock)).toEqual({
      password_actual: CLAVE_ACTUAL,
      password_nueva: CLAVE_NUEVA,
    });
    expect(screen.getByLabelText(/^contraseña actual/i)).toHaveValue('');
  });

  it('ante un fallo de red conserva los datos y permite reintentar', async () => {
    const usuario = userEvent.setup();
    let intentos = 0;
    responderPassword = () => {
      intentos += 1;
      if (intentos === 1) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    };
    montar();
    await screen.findByRole('heading', { name: /mi perfil/i });

    await rellenar(usuario, CLAVE_ACTUAL, CLAVE_NUEVA, CLAVE_NUEVA);
    await usuario.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    expect(await screen.findByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña nueva/i)).toHaveValue(CLAVE_NUEVA);

    await usuario.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument();
    await waitFor(() => expect(intentos).toBe(2));
  });
});
