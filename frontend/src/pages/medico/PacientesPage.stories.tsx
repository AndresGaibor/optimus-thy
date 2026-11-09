import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { PacientesPage } from './PacientesPage';

const meta = {
  title: 'Aplicación/Médico/Pacientes (HU-031)',
  component: PacientesPage,
  parameters: {
    router: { initialEntries: ['/medico/pacientes'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof PacientesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConPacientes: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('PAC-0001');
  },
};

export const SinPacientes: Story = {
  parameters: { msw: { handlers: crearHandlers('vacio') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Todavía no hay pacientes');
  },
};

export const Cargando: Story = {
  parameters: { msw: { handlers: crearHandlers('cargando') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByLabelText('Cargando pacientes');
  },
};

export const RespuestaLenta: Story = {
  parameters: { msw: { handlers: crearHandlers('lento') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByLabelText('Cargando pacientes');
    await canvas.findByText('PAC-0001', {}, { timeout: 4000 });
  },
};

export const DatosParciales: Story = {
  parameters: { msw: { handlers: crearHandlers('parcial') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('PAC-0001');
    await canvas.findByRole('navigation', { name: 'Paginación' });
  },
};

// La página no diferencia 401/403/500 en el listado; es una carencia conocida.
async function afirmarErrorListado(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const alerta = await canvas.findByRole('alert');
  await expect(alerta).toHaveTextContent('No se pudo cargar la lista');
  await canvas.findByRole('button', { name: 'Reintentar' });
}

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: crearHandlers('error') } },
  play: ({ canvasElement }) => afirmarErrorListado(canvasElement),
};

export const SinPermiso: Story = {
  parameters: { msw: { handlers: crearHandlers('sinPermiso') } },
  play: ({ canvasElement }) => afirmarErrorListado(canvasElement),
};

export const NoAutenticado: Story = {
  parameters: { msw: { handlers: crearHandlers('noAutenticado') } },
  play: ({ canvasElement }) => afirmarErrorListado(canvasElement),
};

export const SesionExpirada: Story = {
  parameters: { msw: { handlers: crearHandlers('sesionExpirada') } },
  play: ({ canvasElement }) => afirmarErrorListado(canvasElement),
};

export const ErrorDeValidacion: Story = {
  parameters: { msw: { handlers: crearHandlers('validacion') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Nuevo paciente' }));
    const dialog = within(
      await within(document.body).findByRole('dialog', { name: 'Nuevo paciente' }),
    );
    await userEvent.type(dialog.getByLabelText(/^Nombres/), 'Nombre Demo');
    await userEvent.type(dialog.getByLabelText(/^Apellidos/), 'Apellido Demo');
    await userEvent.type(dialog.getByLabelText(/^Documento/), 'DOC-12345');
    await userEvent.type(dialog.getByLabelText(/^Fecha de nacimiento/), '1990-01-01');
    await userEvent.click(dialog.getByRole('button', { name: 'Guardar' }));
    await expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Revisa los datos introducidos. Hay campos con errores.',
    );
  },
};
