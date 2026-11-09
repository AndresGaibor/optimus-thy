import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Sistema de diseño/Átomos/Input',
  component: Input,
  args: { placeholder: 'Escribe aquí', 'aria-label': 'Campo de texto' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Estados: Story = {
  render: () => (
    <div className="grid max-w-sm gap-4">
      <Input aria-label="Campo normal" placeholder="Campo normal" />
      <Input aria-label="Campo con error" aria-invalid="true" defaultValue="Revisa este valor" />
      <Input aria-label="Campo deshabilitado" disabled placeholder="Deshabilitado" />
      <Input aria-label="Campo de solo lectura" readOnly value="Solo lectura" />
    </div>
  ),
};
export const Playground: Story = {};
