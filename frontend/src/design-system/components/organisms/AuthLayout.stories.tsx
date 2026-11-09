import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { AuthLayout } from './AuthLayout';

const meta = {
  title: 'Sistema de diseño/Organismos/AuthLayout',
  component: AuthLayout,
  args: {
    title: 'Acceso al portal',
    description: 'Elige un perfil para explorar las pantallas de demostración.',
    children: (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="demo-email">Correo de demostración</Label>
          <Input id="demo-email" type="email" value="usuario.demo@example.test" readOnly />
        </div>
        <Button className="w-full" onClick={fn()}>
          Continuar
        </Button>
      </div>
    ),
    footer: <span>Cuenta sintética · no ingreses credenciales reales.</span>,
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof AuthLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AnchoPredeterminado: Story = {
  args: { title: 'Verificación de acceso' },
};
export const PanelAmplio: Story = {
  args: { width: 'lg', title: 'Verificación de acceso' },
};
export const Playground: Story = {};
