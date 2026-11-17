import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { AuditoriaPage } from './AuditoriaPage';

const meta = {
  title: 'Aplicación/Administrador/Auditoría (HU-020)',
  component: AuditoriaPage,
  parameters: {
    router: { initialEntries: ['/administrador/auditoria'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof AuditoriaPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConEventos: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('table', { name: 'Eventos de auditoría' }, { timeout: 8000 });
    await expect(canvas.getAllByText('AUTH.SESSION_START').length).toBeGreaterThan(0);
    await expect(canvas.getAllByText('Sesión iniciada').length).toBeGreaterThan(0);
    await expect(canvas.getByRole('columnheader', { name: /fecha y hora/i })).toBeInTheDocument();
    await expect(canvas.getByText(/en UTC/i)).toBeInTheDocument();
  },
};

export const ConDetalleAbierto: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('table', { name: 'Eventos de auditoría' }, { timeout: 8000 });
    const [primero] = canvas.getAllByRole('button', { name: /ver detalle/i });
    if (!primero) throw new Error('sin eventos');
    await userEvent.click(primero);
    await expect(canvas.getByText('role_code')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /ocultar/i })).toBeVisible();
  },
};

export const SinEventos: Story = {
  parameters: { msw: { handlers: crearHandlers('vacio') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Sin eventos');
  },
};

export const Cargando: Story = {
  parameters: { msw: { handlers: crearHandlers('cargando') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Cargando bitácora');
  },
};

export const ConError: Story = {
  parameters: { msw: { handlers: crearHandlers('error') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('No se pudo cargar la bitácora');
  },
};
