import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ComponentProps } from 'react';
import { Switch } from './Switch';

const meta = {
  title: 'Sistema de diseño/Átomos/Switch',
  component: Switch,
  args: { 'aria-label': 'Activar notificaciones' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Switch>;
export default meta;

type Story = StoryObj<typeof meta>;

function InteractiveSwitch(args: ComponentProps<typeof Switch>) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Switch
        {...args}
        checked={checked}
        onCheckedChange={(next) => {
          args.onCheckedChange?.(next);
          setChecked(next);
        }}
      />
      <span className="text-sm">{checked ? 'Activado' : 'Desactivado'}</span>
    </div>
  );
}

export const Predeterminado: Story = {
  render: (args) => <InteractiveSwitch {...args} />,
};

export const Activado: Story = { args: { defaultChecked: true } };

export const Deshabilitado: Story = { args: { defaultChecked: true, disabled: true } };

export const Controlado: Story = {
  render: (args) => <InteractiveSwitch {...args} />,
};
export const Playground: Story = {};
