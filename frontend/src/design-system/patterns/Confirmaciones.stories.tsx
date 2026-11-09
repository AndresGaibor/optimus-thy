import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, Callout, Dialog, DialogClose, PageHeader } from '../index';

const onConfirmarReversible = fn();
const onConfirmarDestructiva = fn();

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Confirmaciones" description={descripcion} />
      <Callout title="Regla de uso">
        Explica el efecto de la acción y ofrece una salida sin confirmar.
      </Callout>
      {children}
    </main>
  );
}

function FlujoConfirmacion({
  destructiva = false,
  onConfirm,
}: {
  destructiva?: boolean;
  onConfirm: () => void;
}) {
  const [confirmada, setConfirmada] = useState(false);
  const titulo = destructiva ? 'Retirar elemento' : 'Aplicar cambio';
  return (
    <Pagina
      descripcion={
        destructiva ? 'Confirma una acción irreversible.' : 'Confirma un cambio reversible.'
      }
    >
      <Dialog
        title={titulo}
        description={
          destructiva
            ? 'El elemento dejará de estar disponible.'
            : 'El cambio puede revertirse después.'
        }
        trigger={<Button variant={destructiva ? 'destructive' : 'outline'}>{titulo}</Button>}
        footer={
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant={destructiva ? 'destructive' : 'default'}
                onClick={() => {
                  onConfirm();
                  setConfirmada(true);
                }}
              >
                Confirmar
              </Button>
            </DialogClose>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">Revisa el efecto antes de confirmar.</p>
      </Dialog>
      <p role="status" className="text-sm">
        {confirmada ? 'Acción confirmada.' : 'Sin cambios confirmados.'}
      </p>
    </Pagina>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Confirmaciones',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reversible: Story = {
  render: () => <FlujoConfirmacion onConfirm={onConfirmarReversible} />,
  play: async ({ canvasElement }) => {
    onConfirmarReversible.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Aplicar cambio' }));
    const dialog = await within(document.body).findByRole('dialog', { name: 'Aplicar cambio' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await expect(onConfirmarReversible).not.toHaveBeenCalled();
    await expect(canvas.getByRole('status')).toHaveTextContent('Sin cambios confirmados.');
  },
};

export const Destructiva: Story = {
  render: () => <FlujoConfirmacion destructiva onConfirm={onConfirmarDestructiva} />,
  play: async ({ canvasElement }) => {
    onConfirmarDestructiva.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Retirar elemento' }));
    const dialog = await within(document.body).findByRole('dialog', { name: 'Retirar elemento' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    await expect(onConfirmarDestructiva).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('status')).toHaveTextContent('Acción confirmada.');
  },
};
