import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta = {
  title: 'Sistema de diseño/Átomos/Select',
  component: Select,
  args: { 'aria-label': 'Opción seleccionada' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Estados: Story = {
  render: () => (
    <div className="grid max-w-xs gap-4">
      <Select aria-label="Opción editable" defaultValue="primera">
        <option value="primera">Primera opción</option>
        <option value="segunda">Segunda opción</option>
      </Select>
      <Select aria-label="Opción con error" aria-invalid="true" defaultValue="segunda">
        <option value="primera">Primera opción</option>
        <option value="segunda">Segunda opción</option>
      </Select>
      <Select aria-label="Opción deshabilitada" disabled defaultValue="primera">
        <option value="primera">Deshabilitado</option>
      </Select>
    </div>
  ),
};
export const Playground: Story = {};
