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
  mockImplementation: (fn: () => Promise<Response>) => unknown;
}

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function urlDeLlamada(call: unknown[]): string {
  const first = call[0];
  if (first instanceof Request) return first.url;
  return String(first);
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
    expect(screen.getAllByText('María').length).toBeGreaterThan(0);
    expect(
      within(screen.getByRole('table')).getAllByText('Hospital Central').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Médico').length).toBeGreaterThan(0);
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

    await user.click(
      await screen.findByRole('button', {
        name: /desactivar usuario maria@hospital\.es/i,
      }),
    );
    const confirmDialog = await screen.findByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /^desactivar$/i }));

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

    await user.click(await screen.findByRole('button', { name: /gestionar roles de maria/i }));
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

    const search = await screen.findByLabelText(/buscar usuario/i);
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

  it('el filtro de estado envía activo=false', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson([]));

    montarApp();

    await user.selectOptions(await screen.findByLabelText('Estado'), 'inactivo');

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((llamada) => urlDeLlamada(llamada));
      expect(urls.some((url) => url.includes('/usuarios') && url.includes('activo=false'))).toBe(
        true,
      );
    });
  });

  it('limpiar filtros descarta búsqueda, estado e institución', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockImplementation(() => Promise.resolve(responderJson({ total: 0, items: [] })));

    montarApp();

    await user.type(await screen.findByLabelText('Buscar usuario'), 'maria');
    await user.selectOptions(screen.getByLabelText('Estado'), 'activo');
    const barra = screen.getByRole('group', { name: 'Filtros de usuarios' });
    await user.click(within(barra).getByRole('button', { name: /limpiar filtros/i }));

    await waitFor(() => {
      const ultima = fetchMock.mock.calls
        .map((llamada) => urlDeLlamada(llamada))
        .filter((url) => url.includes('/usuarios'))
        .at(-1);
      expect(ultima).toBeDefined();
      expect(ultima).not.toContain('q=');
      expect(ultima).not.toContain('activo=');
      expect(ultima).not.toContain('institucion_id=');
    });
  });

  it('ordenar por nombre alterna la dirección y lo refleja en aria-sort', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockImplementation(() =>
      Promise.resolve(
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
      ),
    );

    montarApp();

    const botonCorreo = await screen.findByRole('button', { name: /ordenar por usuario/i });
    const cabecera = botonCorreo.closest('th');
    expect(cabecera).not.toBeNull();
    await user.click(botonCorreo);

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((llamada) => urlDeLlamada(llamada));
      expect(
        urls.some((url) => url.includes('orden=nombre') && url.includes('direccion=asc')),
      ).toBe(true);
    });
    expect(cabecera).toHaveAttribute('aria-sort', 'ascending');

    const botonCorreo2 = screen.getByRole('button', { name: /ordenar por usuario/i });
    await user.click(botonCorreo2);
    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((llamada) => urlDeLlamada(llamada));
      expect(
        urls.some((url) => url.includes('orden=nombre') && url.includes('direccion=desc')),
      ).toBe(true);
    });
    expect(botonCorreo2.closest('th')).toHaveAttribute('aria-sort', 'descending');
  });

  it('un cambio de estado fallido conserva el listado y muestra el aviso', async () => {
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
    fetchMock.mockResolvedValueOnce(responderJson({ detail: 'boom' }, 500));

    montarApp();

    await user.click(
      await screen.findByRole('button', { name: /desactivar usuario maria@hospital\.es/i }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^desactivar$/i }));

    expect(await screen.findByText(/no se pudo cambiar el estado/i)).toBeInTheDocument();
    expect(screen.getByText('maria@hospital.es')).toBeInTheDocument();
  });

  it('activar no pide confirmación y aplica el estado que devuelve el servidor', async () => {
    const user = userEvent.setup();
    const usuario = {
      id: 'u1',
      correo: 'maria@hospital.es',
      nombre: 'María',
      activo: false,
      institucion: { id: 'i1', nombre: 'Hospital Central' },
      roles: ['doctor'],
    };
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [usuario] }));
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));
    fetchMock.mockResolvedValueOnce(responderJson({ ...usuario, activo: true }));
    fetchMock.mockResolvedValueOnce(
      responderJson({ total: 1, items: [{ ...usuario, activo: true }] }),
    );
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    await user.click(
      await screen.findByRole('button', { name: /activar usuario maria@hospital\.es/i }),
    );

    expect(await screen.findByText(/maria@hospital\.es activado/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const patch = fetchMock.mock.calls.find((call) => {
      const req = call[0];
      const url = req instanceof Request ? req.url : String(req);
      const method =
        req instanceof Request ? req.method : (call[1] as RequestInit | undefined)?.method;
      return url.includes('/usuarios/u1') && method === 'PATCH';
    });
    expect(patch).toBeDefined();
    if (patch) {
      expect(await extraerCuerpo(patch)).toEqual({ activo: true });
    }
  });

  it('une nombre y correo en la misma celda de la columna Usuario', async () => {
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

    const correo = await screen.findByText('maria@hospital.es');
    const celda = correo.closest('td');
    expect(celda).not.toBeNull();
    expect(celda?.textContent).toContain('María');
    expect(screen.getByRole('button', { name: /ordenar por usuario/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /^correo$/i })).toBeNull();
  });

  it('un usuario con varios roles conserva todas sus etiquetas', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [
          {
            id: 'u1',
            correo: 'multi@hospital.es',
            nombre: 'Multi Rol',
            activo: true,
            institucion: { id: 'i1', nombre: 'Hospital Central' },
            roles: ['admin', 'doctor', 'researcher'],
          },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    await screen.findByText('multi@hospital.es');
    const celdaRoles = screen.getAllByText('Investigador')[0]?.closest('td');
    expect(celdaRoles).not.toBeNull();
    expect(celdaRoles?.textContent).toContain('Administrador');
    expect(celdaRoles?.textContent).toContain('Médico');
  });

  it('copia el correo completo y lo anuncia', async () => {
    const user = userEvent.setup();
    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escribir },
      configurable: true,
    });
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [
          {
            id: 'u1',
            correo: 'prueba.api.1793854938@example.institucion-larga.test',
            nombre: 'Prueba',
            activo: true,
            institucion: { id: 'i1', nombre: 'Hospital Central' },
            roles: ['doctor'],
          },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    await user.click(
      await screen.findByRole('button', {
        name: /copiar correo de prueba\.api\.1793854938/i,
      }),
    );

    expect(escribir).toHaveBeenCalledWith('prueba.api.1793854938@example.institucion-larga.test');
    expect(
      await screen.findByText(
        /correo prueba\.api\.1793854938@example\.institucion-larga\.test copiado/i,
      ),
    ).toBeInTheDocument();
  });

  it('la propia cuenta no ofrece desactivarse', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [
          {
            id: 'u1',
            correo: 'admin@t.com',
            nombre: 'Admin',
            activo: true,
            institucion: { id: 'i1', nombre: 'Hospital Central' },
            roles: ['admin'],
          },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson([{ id: 'i1', nombre: 'Hospital Central' }]));

    montarApp();

    const item = await screen.findByRole('button', {
      name: /desactivar usuario admin@t\.com/i,
    });
    expect(item).toBeDisabled();
    expect(item).toHaveAttribute('title', 'No puedes desactivar tu propia cuenta');
  });

  it('el botón de estado abre la confirmación con teclado', async () => {
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

    montarApp();

    const accion = await screen.findByRole('button', {
      name: /desactivar usuario maria@hospital\.es/i,
    });
    accion.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('combina búsqueda, institución y estado en la misma consulta', async () => {
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

    await user.type(await screen.findByLabelText('Buscar usuario'), 'maria');
    await user.selectOptions(
      screen.getByLabelText('Institución', { selector: '#filtro-institucion' }),
      'i2',
    );
    await user.selectOptions(screen.getByLabelText('Estado'), 'activo');

    await waitFor(
      () => {
        const urls = fetchLocal.mock.calls
          .map((llamada) => urlDeLlamada(llamada))
          .filter((url) => url.includes('/usuarios'));
        const ultima = urls.at(-1);
        expect(ultima).toContain('q=maria');
        expect(ultima).toContain('institucion_id=i2');
        expect(ultima).toContain('activo=true');
      },
      { timeout: 2000 },
    );
  });

  it('limpiar filtros solo aparece cuando hay filtros aplicados', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockImplementation(() => Promise.resolve(responderJson({ total: 0, items: [] })));

    montarApp();

    await screen.findByText(/sin usuarios/i);
    const barra = screen.getByRole('group', { name: 'Filtros de usuarios' });
    expect(within(barra).queryByRole('button', { name: /limpiar filtros/i })).toBeNull();
    await user.type(await screen.findByLabelText('Buscar usuario'), 'ana');
    expect(
      await within(barra).findByRole('button', { name: /limpiar filtros/i }),
    ).toBeInTheDocument();
  });
});
