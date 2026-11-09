import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button, Callout, PageHeader, Toast } from '../index';

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Notificaciones" description={descripcion} />
      <Callout title="Límite del componente">
        Toast no gestiona temporizadores ni una pila de notificaciones; el contenedor decide cuándo
        montarlo o desmontarlo.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Notificaciones',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tonos: Story = {
  render: () => (
    <Pagina descripcion="Comunica estados con texto y tono semántico.">
      <div className="flex flex-col gap-3">
        <Toast
          tone="success"
          title="Guardado"
          description="El cambio de demostración quedó registrado."
        />
        <Toast tone="info" title="Información" description="Hay una actualización disponible." />
        <Toast
          tone="warning"
          title="Revisión pendiente"
          description="Confirma los datos antes de continuar."
        />
        <Toast tone="danger" title="No se pudo completar" description="Intenta nuevamente." />
      </div>
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('No se pudo completar');
    await expect(canvas.getAllByRole('status')[0]).toHaveTextContent('Guardado');
  },
};

export const ConAccion: Story = {
  render: () => <ToastContenedor />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Deshacer' }));
    await expect(canvas.getByText('Cambio revertido.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Cerrar notificación' }));
    await expect(canvas.getByText('Notificación cerrada.')).toBeVisible();
  },
};

function ToastContenedor() {
  const [visible, setVisible] = useState(true);
  const [revertido, setRevertido] = useState(false);
  return (
    <Pagina descripcion="Incluye una acción contextual y permite descartar la notificación.">
      {visible ? (
        <Toast
          tone="success"
          title="Cambio aplicado"
          description="Puedes revertir esta acción desde aquí."
          action={
            <Button variant="outline" size="sm" onClick={() => setRevertido(true)}>
              Deshacer
            </Button>
          }
          onDismiss={() => setVisible(false)}
        />
      ) : (
        <p role="status">Notificación cerrada.</p>
      )}
      {revertido ? <p role="status">Cambio revertido.</p> : null}
    </Pagina>
  );
}
