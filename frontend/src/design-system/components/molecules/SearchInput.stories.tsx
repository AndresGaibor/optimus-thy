import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ComponentProps } from 'react';
import { SearchInput } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/SearchInput',
  component: SearchInput,
  args: {
    label: 'Buscar elementos de demostración',
    placeholder: 'Buscar por texto sintético',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveSearchInput(args: ComponentProps<typeof SearchInput>) {
  const [value, setValue] = useState('Demostración sintética');
  return (
    <SearchInput
      {...args}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClear={() => {
        args.onClear?.();
        setValue('');
      }}
    />
  );
}

export const Vacío: Story = {};
export const ConTextoYLimpieza: Story = {
  render: (args) => <InteractiveSearchInput {...args} />,
};
export const Deshabilitado: Story = {
  args: { disabled: true, placeholder: 'Búsqueda no disponible en este ejemplo' },
};
export const Playground: Story = {};
