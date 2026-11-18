import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CorreoPage } from '../pages/admin/CorreoPage';

interface Peticion {
  url: string;
  metodo: string;
  cuerpo?: unknown;
}

const configuracion = {
  host: 'smtp.gmail.com',
  puerto: 587,
  seguridad: 'starttls',
  usuario: 'ana.garcia@example.test',
  remitente: 'ana.garcia@example.test',
  remitente_nombre: 'OPTIMUS-THY',
  activo: true,
  tiene_password: true,
};

const campos = {
  titulo: 'Restablece tu contraseña',
  mensaje: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
  boton: 'Elige una contraseña nueva',
  nota: 'El enlace caduca en {{expira_en}}.',
  pie: 'Si no fuiste tú, ignora este mensaje.',
};

const plantilla = {
  clave: 'recuperacion',
  asunto: 'Restablece tu contraseña',
  html: '<p>Hola {{nombre}}</p>',
  modo: 'visual',
  campos,
  variables: ['enlace', 'expira_en', 'nombre'],
  de_fabrica: true,
};

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/administrador/correo']}>
      <CorreoPage />
    </MemoryRouter>,
  );
}

describe('configuración del correo', () => {
  let peticiones: Peticion[];
  let fallarGuardado: boolean;

  beforeEach(() => {
    vi.restoreAllMocks();
    peticiones = [];
    fallarGuardado = false;
    const mock = vi.fn(async (entrada: Request) => {
      const cuerpo =
        entrada.method === 'GET'
          ? undefined
          : await entrada
              .clone()
              .json()
              .catch(() => undefined);
      peticiones.push({ url: entrada.url, metodo: entrada.method, cuerpo });
      if (entrada.url.includes('/plantillas-correo')) {
        if (entrada.url.endsWith('/preview')) {
          return responder({ asunto: 'Restablece tu contraseña', html: '<p>Hola Ana Pérez</p>' });
        }
        if (entrada.url.endsWith('/restaurar')) return responder(plantilla);
        if (entrada.method === 'PUT') {
          const datos = cuerpo as { asunto: string; html: string };
          return responder({ ...plantilla, ...datos, de_fabrica: false });
        }
        return responder(plantilla);
      }
      if (entrada.url.includes('/configuracion-correo/probar')) {
        return responder({ destinatario: 'ana.garcia@example.test' });
      }
      if (entrada.method === 'PUT') {
        if (fallarGuardado) {
          return responder(
            { error: { code: 'remitente_invalido', message: 'El remitente no es válido.' } },
            422,
          );
        }
        return responder(configuracion);
      }
      return responder(configuracion);
    });
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mock as unknown as typeof fetch;
  });

  it('muestra que hay contraseña guardada sin revelarla', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Servidor' }));
    expect(await screen.findByLabelText('Contraseña')).toHaveValue('');
    expect(screen.getByText(/ya hay una contraseña guardada/i)).toBeInTheDocument();
  });

  it('guarda sin enviar la contraseña cuando no se escribe una nueva', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Servidor' }));
    await screen.findByLabelText('Usuario');

    await usuario.click(screen.getByRole('button', { name: /^guardar$/i }));

    const guardado = peticiones.find(
      (peticion) => peticion.metodo === 'PUT' && peticion.url.includes('/configuracion-correo'),
    );
    expect(guardado).toBeDefined();
    expect(guardado?.cuerpo).not.toHaveProperty('password');
    expect(await screen.findByText('Configuración guardada.')).toBeInTheDocument();
  });

  it('envía la contraseña nueva cuando se escribe', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Servidor' }));
    await screen.findByLabelText('Contraseña');

    await usuario.type(screen.getByLabelText('Contraseña'), 'abcd efgh ijkl mnop');
    await usuario.click(screen.getByRole('button', { name: /^guardar$/i }));

    const guardado = peticiones.find(
      (peticion) => peticion.metodo === 'PUT' && peticion.url.includes('/configuracion-correo'),
    );
    expect((guardado?.cuerpo as { password?: string }).password).toBe('abcd efgh ijkl mnop');
  });

  it('muestra el error de la API al guardar', async () => {
    fallarGuardado = true;
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Servidor' }));
    await screen.findByLabelText('Usuario');

    await usuario.click(screen.getByRole('button', { name: /^guardar$/i }));

    expect(await screen.findByText('El remitente no es válido.')).toBeInTheDocument();
  });

  it('envía una prueba e indica el destinatario', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Servidor' }));
    await screen.findByLabelText('Usuario');

    await usuario.click(screen.getByRole('button', { name: /enviar prueba/i }));

    expect(
      await screen.findByText(/correo de prueba enviado a ana\.garcia@example\.test/i),
    ).toBeInTheDocument();
  });

  it('guarda el modo Diseño con sus campos', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Plantilla' }));

    const mensaje = await screen.findByLabelText('Mensaje');
    await usuario.clear(mensaje);
    await usuario.type(mensaje, 'Te enviamos un enlace para elegir otra contraseña.');

    await usuario.click(screen.getByRole('button', { name: /guardar plantilla/i }));

    const guardado = peticiones.find(
      (peticion) => peticion.metodo === 'PUT' && peticion.url.includes('/plantillas-correo'),
    );
    expect(guardado?.cuerpo).toMatchObject({
      modo: 'visual',
      campos: { mensaje: 'Te enviamos un enlace para elegir otra contraseña.' },
    });
    expect(await screen.findByText('Plantilla guardada.')).toBeInTheDocument();
  });

  it('muestra la vista previa que compone el servidor', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Plantilla' }));

    const marco = await screen.findByTitle('Vista previa del correo');
    await vi.waitFor(() => expect(marco.getAttribute('srcdoc')).toContain('Hola Ana Pérez'));
    const previa = peticiones.find((peticion) => peticion.url.includes('/preview'));
    expect((previa?.cuerpo as { modo?: string }).modo).toBe('visual');
  });

  it('pide confirmación antes de restaurar la plantilla', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(await screen.findByRole('tab', { name: 'Plantilla' }));

    await usuario.click(screen.getByRole('button', { name: /guardar plantilla/i }));
    await screen.findByText('Plantilla guardada.');

    await usuario.click(screen.getByRole('button', { name: /restaurar la de fábrica/i }));
    const dialogo = await screen.findByRole('dialog', { name: /restaurar la plantilla/i });
    expect(dialogo).toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole('button', { name: /^restaurar$/i }));
    expect(await screen.findByText('Plantilla de fábrica restaurada.')).toBeInTheDocument();
  });
});
