import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { UsuariosPage } from './UsuariosPage';

const meta = {
  title: 'Aplicación/Administrador/Gestión de usuarios (HU-010)',
  component: UsuariosPage,
  parameters: {
    router: { initialEntries: ['/administrador/usuarios'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof UsuariosPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConUsuarios: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('ana.garcia@example.test');
  },
};

export const SinUsuarios: Story = {
  parameters: { msw: { handlers: crearHandlers('vacio') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Sin usuarios');
  },
};

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: crearHandlers('error') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Error');
    await expect(canvas.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  },
};

export const Cargando: Story = {
  parameters: { msw: { handlers: crearHandlers('cargando') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByLabelText('Cargando usuarios');
  },
};
