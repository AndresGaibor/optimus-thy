import type { Meta, StoryObj } from '@storybook/react';
import { FilterBar, Select } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/FilterBar',
  component: FilterBar,
  args: {
    label: 'Filtros de demostración',
    children: (
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        Estado de muestra
        <Select aria-label="Estado de muestra" defaultValue="todos">
          <option value="todos">Todos</option>
          <option value="completo">Completo</option>
          <option value="pendiente">Pendiente</option>
        </Select>
      </label>
    ),
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConRestablecimiento: Story = {};
export const SinFiltrosActivos: Story = {
  render: () => (
    <FilterBar label="Filtros de demostración">
      <span className="text-sm text-muted-foreground">Sin filtros adicionales</span>
    </FilterBar>
  ),
};
