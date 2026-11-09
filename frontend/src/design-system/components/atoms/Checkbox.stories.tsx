import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ComponentProps } from 'react';
import { Checkbox } from './Checkbox';
import { Label } from './Label';

const meta = {
  title: 'Sistema de diseño/Átomos/Checkbox',
  component: Checkbox,
  args: {},
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Checkbox>;
export default meta;

type Story = StoryObj<typeof meta>;
function InteractiveCheckbox(args: ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        {...args}
        id="casilla-demo"
        checked={checked}
        onChange={(evento) => {
          args.onChange?.(evento);
          setChecked(evento.target.checked);
        }}
      />
      <Label htmlFor="casilla-demo">Acepto los términos</Label>
    </div>
  );
}

export const Normal: Story = {
  render: (args) => <InteractiveCheckbox {...args} />,
};

export const Marcado: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="casilla-marcada" defaultChecked />
      <Label htmlFor="casilla-marcada">Acepto los términos</Label>
    </div>
  ),
};

export const Deshabilitado: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="casilla-deshabilitada" defaultChecked disabled />
      <Label htmlFor="casilla-deshabilitada" className="opacity-50">
        Acepto los términos
      </Label>
    </div>
  ),
};

export const ConError: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="casilla-error" aria-invalid />
      <Label htmlFor="casilla-error">Confirmación requerida</Label>
    </div>
  ),
};
export const Playground: Story = { args: { 'aria-label': 'Acepto los términos' } };
