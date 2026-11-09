import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ReactNode } from 'react';
import { Button, Callout, Dialog, Field, Input, PageHeader } from '../index';

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Modales" description={descripcion} />
      <Callout title="Regla de uso">
        Reserva el diálogo para una tarea enfocada que requiera atención.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Modales',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Informativo: Story = {
  render: () => (
    <Pagina descripcion="Presenta una explicación breve y permite regresar al contexto.">
      <Dialog
        title="Información de demostración"
        description="Este contenido es sintético y no se guarda."
        trigger={<Button variant="outline">Ver información</Button>}
      >
        <p className="text-sm text-muted-foreground">Consulta el detalle antes de continuar.</p>
      </Dialog>
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Ver información' });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Información de demostración',
    });
    await expect(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

export const ConFormulario: Story = {
  render: () => (
    <Pagina descripcion="Agrupa los controles de una tarea en una superficie modal.">
      <Dialog
        title="Revisar datos"
        description="Formulario de ejemplo; no se transmiten datos."
        trigger={<Button>Revisar datos</Button>}
      >
        <Field label="Código de demostración">
          <Input name="codigo" defaultValue="DEMO-001" />
        </Field>
      </Dialog>
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Revisar datos' });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole('dialog', { name: 'Revisar datos' });
    await expect(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};
