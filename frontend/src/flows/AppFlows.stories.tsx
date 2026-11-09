import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AppRoutes } from '../AppRoutes';
import { crearHandlersFlujo } from '../mocks/flujos';
import { SessionProvider } from '../session/SessionContext';

function VistaFlujo() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  );
}

const meta = {
  title: 'Aplicación/Flujos',
  component: VistaFlujo,
  tags: ['ai-generated'],
} satisfies Meta<typeof VistaFlujo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MedicoDelAccesoAPacientes: Story = {
  name: 'Médico, del acceso a pacientes (HU-001, HU-031)',
  parameters: {
    docs: {
      description: {
        story:
          'Recorre HU-001 (acceso) y HU-031 (pacientes) con datos sintéticos. La persona inicia en `/`, inicia sesión como médica de demostración, llega a pacientes, usa la navegación lateral y cierra sesión (HU-002).',
      },
    },
    router: { initialEntries: ['/'] },
    msw: { handlers: crearHandlersFlujo() },
    a11y: { test: 'error' },
  },
  render: () => (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Redirige a la pantalla de acceso', async () => {
      await expect(await canvas.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      await expect(canvas.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    });

    await step('Inicia sesión como médica de demostración', async () => {
      await userEvent.type(canvas.getByLabelText(/correo electrónico/i), 'medico@demo.test');
      await userEvent.type(canvas.getByLabelText(/contraseña/i), 'clave-demo');
      await userEvent.click(canvas.getByRole('button', { name: 'Entrar' }));
    });

    await step('Llega a pacientes con navegación lateral de médico', async () => {
      await expect(await canvas.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
      await expect(await canvas.findByText('PAC-0001')).toBeInTheDocument();
      await expect(canvas.getByRole('link', { name: 'Pacientes' })).toBeInTheDocument();
      await expect(canvas.getByRole('link', { name: 'Inferencia' })).toBeInTheDocument();
    });

    await step('Cierra sesión y vuelve al acceso', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Cerrar sesión' }));
      await expect(await canvas.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });
  },
};

export const AdministradorUsuariosYRoles: Story = {
  name: 'Administrador, usuarios y roles (HU-010, HU-011)',
  parameters: {
    docs: {
      description: {
        story:
          'Recorre HU-010 (usuarios) y HU-011 (roles y permisos). Con sesión administrativa llega al listado de usuarios y navega entre Usuarios y Roles por la barra lateral.',
      },
    },
    router: { initialEntries: ['/login'] },
    msw: { handlers: crearHandlersFlujo() },
    a11y: { test: 'error' },
  },
  render: () => (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Inicia sesión con la cuenta administrativa sintética', async () => {
      await expect(await canvas.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      await userEvent.type(canvas.getByLabelText(/correo electrónico/i), 'admin@demo.test');
      await userEvent.type(canvas.getByLabelText(/contraseña/i), 'clave-demo');
      await userEvent.click(canvas.getByRole('button', { name: 'Entrar' }));
      await expect(await canvas.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    });

    await step('Navega a roles y verifica la matriz', async () => {
      await userEvent.click(canvas.getByRole('link', { name: 'Roles' }));
      await expect(
        await canvas.findByRole('table', { name: 'Matriz de permisos por rol' }),
      ).toBeInTheDocument();
    });

    await step('Regresa a usuarios', async () => {
      await userEvent.click(canvas.getByRole('link', { name: 'Usuarios' }));
      await expect(await canvas.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    });
  },
};

export const AccesoDenegadoPorRol: Story = {
  name: 'Acceso denegado por rol',
  parameters: {
    docs: {
      description: {
        story:
          'Verifica el control de acceso por rol. Una sesión de médico que intenta abrir una ruta de administrador recibe acceso denegado y puede volver a su inicio.',
      },
    },
    router: { initialEntries: ['/administrador/usuarios'] },
    msw: { handlers: crearHandlersFlujo({ roles: ['doctor'], rolActivo: 'doctor' }) },
    a11y: { test: 'error' },
  },
  render: () => (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Muestra acceso denegado', async () => {
      await expect(await canvas.findByText('Acceso denegado')).toBeInTheDocument();
    });

    await step('Vuelve al inicio del rol activo', async () => {
      await userEvent.click(canvas.getByRole('link', { name: 'Volver a tu inicio' }));
      await expect(await canvas.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
    });
  },
};

export const RecuperacionDeContrasena: Story = {
  name: 'Recuperación de contraseña (HU-111)',
  parameters: {
    docs: {
      description: {
        story:
          'Recorre HU-111 desde la pantalla pública. La recuperación es presentacional: no hay endpoints ni envío real; el formulario permanece en pantalla tras pulsar Enviar enlace.',
      },
    },
    router: { initialEntries: ['/login'] },
    msw: { handlers: crearHandlersFlujo() },
    a11y: { test: 'error' },
  },
  render: () => (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abre la recuperación desde el acceso', async () => {
      await expect(await canvas.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      await userEvent.click(canvas.getByRole('link', { name: '¿Olvidaste tu contraseña?' }));
      await expect(
        await canvas.findByRole('heading', { name: 'Recuperar contraseña' }),
      ).toBeInTheDocument();
    });

    await step('Completa el correo y confirma que no se envía', async () => {
      await userEvent.type(
        canvas.getByLabelText(/correo electrónico/i),
        'persona.demo@example.test',
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Enviar enlace' }));
      await expect(
        canvas.getByRole('heading', { name: 'Recuperar contraseña' }),
      ).toBeInTheDocument();
      await expect(canvas.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    });
  },
};

export const CambioDeRolActivo: Story = {
  name: 'Cambio de rol activo',
  parameters: {
    docs: {
      description: {
        story:
          'Recorre HU-003 (rol activo). Una cuenta multirrol de demostración inicia en médico y cambia a administrador desde la barra lateral, aterrizando en gestión de usuarios.',
      },
    },
    router: { initialEntries: ['/'] },
    msw: {
      handlers: crearHandlersFlujo({
        roles: ['doctor', 'admin'],
        rolActivo: 'doctor',
        correo: 'dual@demo.test',
        nombre: 'Persona Demo Multirrol',
      }),
    },
    a11y: { test: 'error' },
  },
  render: () => (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Aterriza en el inicio del rol activo (médico)', async () => {
      await expect(await canvas.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
    });

    await step('Cambia al rol administrador', async () => {
      const grupo = canvas.getByRole('group', { name: 'Cambiar de rol' });
      await userEvent.click(within(grupo).getByRole('button', { name: 'Administrador' }));
      await expect(await canvas.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    });
  },
};

export const RutaInexistente: Story = {
  name: 'Ruta inexistente',
  parameters: {
    docs: {
      description: {
        story:
          'Verifica el comportamiento ante rutas desconocidas: la aplicación muestra la pantalla de página no encontrada.',
      },
    },
    router: { initialEntries: ['/cualquier-cosa'] },
    msw: { handlers: crearHandlersFlujo({ roles: ['doctor'], rolActivo: 'doctor' }) },
    a11y: { test: 'error' },
  },
  render: () => (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Muestra la página no encontrada', async () => {
      await expect(
        await canvas.findByRole('heading', { name: 'Página no encontrada' }),
      ).toBeInTheDocument();
    });
  },
};
