import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { RolesPage } from './RolesPage';

const meta = {
  title: 'Aplicación/Administrador/Roles y permisos (HU-011)',
  component: RolesPage,
  parameters: {
    router: { initialEntries: ['/administrador/roles'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof RolesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Predeterminada: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('table', { name: 'Matriz de permisos por rol' });
    await expect(canvas.getByRole('columnheader', { name: 'Administrador' })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: 'medico' })).toBeInTheDocument();
  },
};

export const SinRoles: Story = {
  parameters: { msw: { handlers: crearHandlers('vacio') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Sin roles');
    await expect(canvas.getByText('No hay roles configurados en el sistema.')).toBeInTheDocument();
  },
};

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: crearHandlers('error') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Error')).toBeInTheDocument();
    await expect(
      canvas.getByText('No se pudo cargar la matriz de permisos. Reintenta la operación.'),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  },
};

export const Cargando: Story = {
  parameters: { msw: { handlers: crearHandlers('cargando') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByLabelText('Cargando matriz de permisos');
  },
};
