import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from 'storybook/test';
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
    await canvas.findByText('AUTH.SESSION_START');
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
