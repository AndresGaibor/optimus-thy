import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { CorreoPage } from './CorreoPage';

const meta = {
  title: 'Aplicación/Administrador/Correo (TES-377)',
  component: CorreoPage,
  parameters: {
    router: { initialEntries: ['/administrador/correo'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof CorreoPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConConfiguracion: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Correo' }, { timeout: 8000 });
    await expect(canvas.getByLabelText('Usuario')).toHaveValue('ana.garcia@example.test');
    await expect(canvas.getByLabelText('Contraseña')).toHaveValue('');
    await expect(canvas.getByText(/ya hay una contraseña guardada/i)).toBeInTheDocument();
  },
};

export const SinConfigurar: Story = {
  parameters: { msw: { handlers: crearHandlers('vacio') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Correo' }, { timeout: 8000 });
    await expect(canvas.getByLabelText('Usuario')).toHaveValue('');
    await expect(
      canvas.getByText(/contraseña de aplicación de 16 caracteres/i),
    ).toBeInTheDocument();
  },
};

export const ConPlantilla: Story = {
  parameters: { msw: { handlers: crearHandlers('ok') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Correo' }, { timeout: 8000 });
    await userEvent.click(canvas.getByRole('tab', { name: 'Plantilla' }));
    await expect(canvas.getByLabelText('Asunto')).toHaveValue(
      'Restablece tu contraseña en OPTIMUS-THY',
    );
    await expect(canvas.getByTitle('Vista previa de la plantilla')).toBeInTheDocument();
    await expect(canvas.getByText(/usando la plantilla de fábrica/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /restaurar la de fábrica/i })).toBeDisabled();
  },
};

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: crearHandlers('error') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/no se pudo cargar/i, undefined, { timeout: 8000 });
    await expect(canvas.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  },
};
