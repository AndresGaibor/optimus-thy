import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '../atoms/Button';
import { Callout } from '../molecules/Callout';
import { Dialog, DialogClose, type DialogProps } from './Dialog';

function StatefulDialog({ open: openProp, defaultOpen, onOpenChange, ...props }: DialogProps) {
  const [open, setOpen] = useState(openProp ?? defaultOpen ?? false);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  return <Dialog {...props} open={open} onOpenChange={handleOpenChange} />;
}

const meta = {
  title: 'Sistema de diseño/Organismos/Dialog',
  component: Dialog,
  args: {
    title: 'Detalle de demostración',
    description: 'Contenido sintético para revisar la estructura del diálogo.',
    trigger: <Button variant="outline">Abrir detalle</Button>,
    children: (
      <div className="space-y-4">
        <Callout tone="info" title="Solo demostración">
          Este diálogo no guarda ni envía información.
        </Callout>
        <p className="text-sm text-muted-foreground">
          El cierre restaura el foco al control que lo abrió.
        </p>
      </div>
    ),
    footer: (
      <DialogClose asChild>
        <Button onClick={fn()}>Entendido</Button>
      </DialogClose>
    ),
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CierreConEscape: Story = {
  render: (args) => <StatefulDialog {...args} />,
  args: { defaultOpen: true, size: 'lg' },
};
export const Abierto: Story = {
  render: (args) => <StatefulDialog {...args} />,
  args: { defaultOpen: true, title: 'Confirmación visual' },
};
export const SinDescripcion: Story = {
  render: (args) => {
    const dialogArgs = { ...args };
    delete dialogArgs.description;
    return <StatefulDialog {...dialogArgs} />;
  },
  args: { defaultOpen: true, title: 'Confirmación visual' },
};
export const Playground: Story = {};
