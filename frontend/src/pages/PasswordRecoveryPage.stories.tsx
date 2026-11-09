import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PasswordRecoveryPage } from './PasswordRecoveryPage';

const meta = {
  title: 'Aplicación/Pública/Recuperar contraseña (HU-111)',
  component: PasswordRecoveryPage,
  parameters: {
    router: { initialEntries: ['/login/recuperar'] },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof PasswordRecoveryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solicitud: Story = {
  args: { estado: 'solicitud' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const correo = canvas.getByLabelText(/correo electrónico/i);
    await expect(correo).toBeInTheDocument();
    await userEvent.type(correo, 'demo.recuperacion@example.test');
    await expect(correo).toHaveValue('demo.recuperacion@example.test');
    await userEvent.click(canvas.getByRole('button', { name: 'Enviar enlace' }));
    await expect(canvas.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();
    await expect(correo).toBeInTheDocument();
  },
};

export const SolicitudEnviada: Story = {
  args: { estado: 'enviada' },
};

export const ErrorAlEnviar: Story = {
  args: { estado: 'error' },
};

export const EnlaceCaducado: Story = {
  args: { estado: 'enlace-expirado' },
};

export const NuevaContrasena: Story = {
  args: { estado: 'nueva-contrasena' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/contraseña nueva/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/repetir contraseña/i)).toBeInTheDocument();
  },
};

export const ContrasenaActualizada: Story = {
  args: { estado: 'completada' },
};
