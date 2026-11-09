import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ReactNode } from 'react';
import { Callout, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '../index';

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Navegación" description={descripcion} />
      <Callout title="Regla de uso">
        Agrupa contenido relacionado y permite recorrer las secciones con teclado.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Navegación',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pestañas: Story = {
  render: () => (
    <Pagina descripcion="Organiza tres secciones relacionadas sin cambiar de página.">
      <Tabs defaultValue="resumen">
        <TabsList aria-label="Secciones del registro">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">Resumen sintético del registro.</TabsContent>
        <TabsContent value="detalles">Detalles de demostración.</TabsContent>
        <TabsContent value="historial">Historial de ejemplo.</TabsContent>
      </Tabs>
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const detalles = canvas.getByRole('tab', { name: 'Detalles' });
    await userEvent.click(detalles);
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Detalles de demostración.');
    detalles.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Historial' })).toHaveFocus();
  },
};
