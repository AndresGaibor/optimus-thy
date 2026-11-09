import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';
import { Input } from './Input';

const meta = {
  title: 'Sistema de diseño/Átomos/Label',
  component: Label,
  args: { children: 'Nombre de usuario' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Label>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const CampoRequerido: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="usuario" requiredMark>
        Nombre de usuario
      </Label>
      <Input id="usuario" required placeholder="Escribe aquí" />
    </div>
  ),
};
export const Playground: Story = {};
