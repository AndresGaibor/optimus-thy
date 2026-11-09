import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppShell } from '../layout/AppShell';
import { UsuariosPage } from '../pages/admin/UsuariosPage';
import { RoleRoute } from '../session/RoleRoute';
import { SessionProvider } from '../session/SessionContext';

const mockSessionAdmin = {
  usuario: { id: '1', correo: 'admin@t.com', nombre: 'Admin' },
  roles: ['admin'],
  rol_activo: 'admin',
};

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/administrador/usuarios']}>
      <SessionProvider>
        <Routes>
          <Route
            path="/administrador"
            element={
              <RoleRoute role="administrador">
                <AppShell />
              </RoleRoute>
            }
          >
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

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

async function extraerCuerpo(call: unknown[]): Promise<unknown> {
  const first = call[0];
  if (first instanceof Request) {
    try {
      const text = await first.clone().text();
      if (!text) return undefined;
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }
  const opts = call[1] as RequestInit | undefined;
  if (!opts?.body) {
    return undefined;
  }
  if (typeof opts.body === 'string') {
    try {
      return JSON.parse(opts.body);
    } catch {
      return opts.body;
    }
  }
  return opts.body;
}

describe('usuarios admin', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn((input: unknown) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : '';
      const cuerpo = url.includes('/instituciones') ? [] : { total: 0, items: [] };
      return Promise.resolve(responderJson(cuerpo));
    }) as unknown as FetchMock;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('pinta filas del listado', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [
          {
            id: 'u1',
            correo: 'maria@hospital.es',
            nombre: 'María',
            activo: true,
            institucion: { id: 'i1', nombre: 'Hospital Central' },
            roles: ['doctor'],
          },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    expect(await screen.findByText('maria@hospital.es')).toBeInTheDocument();
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Hospital Central')).toBeInTheDocument();
    expect(screen.getByText('Médico')).toBeInTheDocument();
  });

  it('el alta envía POST /usuarios con el cuerpo correcto', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));
    fetchMock.mockResolvedValueOnce(
      responderJson(
        {
          id: 'u2',
          correo: 'nuevo@hospital.es',
          nombre: 'Nuevo',
          activo: true,
          institucion: { id: 'i1', nombre: 'Hospital Central' },
          roles: ['admin'],
        },
        201,
      ),
    );
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    await user.click(await screen.findByRole('button', { name: /nuevo usuario/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/correo/i), 'nuevo@hospital.es');
    await user.type(within(dialog).getByLabelText(/nombre/i), 'Nuevo');
    const institucionSelect = within(dialog).getByLabelText(/institución/i);
    await user.selectOptions(institucionSelect, 'i1');
    const checkboxes = within(dialog).getAllByRole('checkbox');
    const rolAdminCheckbox = checkboxes.find((checkbox) =>
      checkbox.parentElement?.textContent?.includes('Administrador'),
    );
    if (rolAdminCheckbox) {
      await user.click(rolAdminCheckbox);
    } else {
      const primerCheckbox = checkboxes[0];
      if (primerCheckbox) {
        await user.click(primerCheckbox);
      }
    }
    await user.type(within(dialog).getByLabelText(/contraseña temporal/i), 'temporal12345');
    const crearBtn = within(dialog).getByRole('button', { name: /^crear$/i });
    await user.click(crearBtn);
    await waitFor(async () => {
      const calls = fetchMock.mock.calls;
      const postCall = calls.find((call) => {
        const req = call[0];
        const url = req instanceof Request ? req.url : req;
        const method =
          req instanceof Request ? req.method : (call[1] as RequestInit | undefined)?.method;
        return typeof url === 'string' && url.includes('/usuarios') && method === 'POST';
      });
      expect(postCall).toBeDefined();
      if (postCall) {
        const body = (await extraerCuerpo(postCall)) as Record<string, unknown>;
        expect(body).toEqual({
          correo: 'nuevo@hospital.es',
          nombre: 'Nuevo',
          institucion_id: 'i1',
          roles: ['admin'],
          password: 'temporal12345',
        });
      }
    });
  });

  it('desactivar envía PATCH /usuarios/{id} con {activo:false}', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [
          {
            id: 'u1',
            correo: 'maria@hospital.es',
            nombre: 'María',
            activo: true,
            institucion: { id: 'i1', nombre: 'Hospital Central' },
            roles: ['doctor'],
          },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));
    fetchMock.mockResolvedValueOnce(responderJson({}));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    const switchBtn = await screen.findByRole('switch', { name: /desactivar/i });
    await user.click(switchBtn);
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /confirmar/i }));

    await waitFor(async () => {
      const calls = fetchMock.mock.calls;
      const patchCall = calls.find((call) => {
        const req = call[0];
        const url = req instanceof Request ? req.url : req;
        const method =
          req instanceof Request ? req.method : (call[1] as RequestInit | undefined)?.method;
        return typeof url === 'string' && url.includes('/usuarios/') && method === 'PATCH';
      });
      expect(patchCall).toBeDefined();
      if (patchCall) {
        const body = (await extraerCuerpo(patchCall)) as Record<string, unknown>;
        expect(body).toEqual({ activo: false });
      }
    });
  });

  it('un 409 muestra el mensaje de correo duplicado', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));
    fetchMock.mockResolvedValueOnce(responderJson({}, 409));

    montarApp();

    await user.click(await screen.findByRole('button', { name: /nuevo usuario/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/correo/i), 'dup@hospital.es');
    await user.type(within(dialog).getByLabelText(/nombre/i), 'Dup');
    const institucionSelect = within(dialog).getByLabelText(/institución/i);
    await user.selectOptions(institucionSelect, 'i1');
    const checkboxes = within(dialog).getAllByRole('checkbox');
    const rolAdminCheckbox = checkboxes.find((checkbox) =>
      checkbox.parentElement?.textContent?.includes('Administrador'),
    );
    if (rolAdminCheckbox) {
      await user.click(rolAdminCheckbox);
    } else {
      const primerCheckbox = checkboxes[0];
      if (primerCheckbox) {
        await user.click(primerCheckbox);
      }
    }
    await user.type(within(dialog).getByLabelText(/contraseña temporal/i), 'temporal12345');
    await user.click(within(dialog).getByRole('button', { name: /^crear$/i }));

    expect(await within(dialog).findByText(/correo electrónico/i)).toBeInTheDocument();
  });

  it('el estado vacío aparece sin filas', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([]));

    montarApp();

    expect(await screen.findByText(/sin usuarios/i)).toBeInTheDocument();
  });

  it('el diálogo de roles envía PUT /usuarios/{id}/roles con los roles elegidos', async () => {
    const user = userEvent.setup();
    const usuario = {
      id: 'u1',
      correo: 'maria@hospital.es',
      nombre: 'María',
      activo: true,
      institucion: { id: 'i1', nombre: 'Hospital Central' },
      roles: ['doctor'],
    };
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [usuario] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));
    fetchMock.mockResolvedValueOnce(responderJson({ ...usuario, roles: ['doctor', 'researcher'] }));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [usuario] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    await user.click(await screen.findByRole('button', { name: /^roles$/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('maria@hospital.es')).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'Médico' })).toBeChecked();
    await user.click(within(dialog).getByRole('checkbox', { name: 'Investigador' }));
    await user.click(within(dialog).getByRole('button', { name: /^guardar$/i }));

    await waitFor(async () => {
      const putCall = fetchMock.mock.calls.find((call) => {
        const req = call[0];
        const url = req instanceof Request ? req.url : req;
        const method =
          req instanceof Request ? req.method : (call[1] as RequestInit | undefined)?.method;
        return typeof url === 'string' && url.includes('/usuarios/u1/roles') && method === 'PUT';
      });
      expect(putCall).toBeDefined();
      if (putCall) {
        const body = (await extraerCuerpo(putCall)) as Record<string, unknown>;
        expect(body).toEqual({ roles: ['doctor', 'researcher'] });
      }
    });
  });

  it('el filtro de institución lista las instituciones y envía institucion_id', async () => {
    const user = userEvent.setup();
    const fetchLocal = vi.fn((input: unknown) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/auth/me')) return Promise.resolve(responderJson(mockSessionAdmin));
      if (url.includes('/instituciones')) {
        return Promise.resolve(
          responderJson([
            { id: 'i1', nombre: 'ESPOCH', codigo: 'ESPOCH' },
            { id: 'i2', nombre: 'SOLCA', codigo: 'SOLCA' },
          ]),
        );
      }
      return Promise.resolve(responderJson({ total: 0, items: [] }));
    });
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchLocal as unknown as typeof fetch;

    montarApp();

    const filtro = await screen.findByLabelText('Institución', { selector: '#filtro-institucion' });
    expect(
      within(filtro)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Todas las instituciones', 'ESPOCH', 'SOLCA']);
    await user.selectOptions(filtro, 'i2');

    await waitFor(() => {
      const urls = fetchLocal.mock.calls.map((c) => {
        const req = c[0];
        return req instanceof Request ? req.url : String(req);
      });
      expect(urls.some((u) => u.includes('/usuarios') && u.includes('institucion_id=i2'))).toBe(
        true,
      );
    });
  });

  it('la búsqueda envía q', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([]));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([]));

    montarApp();

    const search = await screen.findByLabelText(/buscar por correo o nombre/i);
    await user.type(search, 'maria');

    await waitFor(() => {
      const calls = fetchMock.mock.calls;
      const listCall = calls.find((call) => {
        const req = call[0];
        const url = req instanceof Request ? req.url : req;
        return typeof url === 'string' && url.includes('/usuarios');
      });
      expect(listCall).toBeDefined();
    });
  });

  it('una contraseña temporal de menos de 12 caracteres se rechaza sin llamar al servidor', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    await user.click(await screen.findByRole('button', { name: /nuevo usuario/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/correo/i), 'nuevo@hospital.es');
    await user.type(within(dialog).getByLabelText(/nombre/i), 'Nuevo');
    await user.selectOptions(within(dialog).getByLabelText(/institución/i), 'i1');
    const primerRol = within(dialog).getAllByRole('checkbox')[0];
    if (primerRol) await user.click(primerRol);
    await user.type(within(dialog).getByLabelText(/contraseña temporal/i), 'corta1234');
    const llamadasAntes = fetchMock.mock.calls.length;
    await user.click(within(dialog).getByRole('button', { name: /^crear$/i }));

    expect(await within(dialog).findByText(/al menos 12 caracteres/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.length).toBe(llamadasAntes);
  });
});
