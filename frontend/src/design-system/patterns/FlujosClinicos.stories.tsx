import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { AiResultCard, Callout, PageHeader, SupportNotice, Timeline } from '../index';

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Flujos clínicos" description={descripcion} />
      <Callout title="Uso responsable">
        Los ejemplos son sintéticos. La IA aporta apoyo para revisión profesional; no diagnostica.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Flujos clínicos',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ApoyoADecision: Story = {
  render: () => (
    <Pagina descripcion="Presenta una salida de modelo como apoyo a la revisión profesional.">
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Resultado del modelo</h2>
        <AiResultCard
          classification="benigno"
          probability={0.82}
          modelVersion="demo-1.0"
          date="8 nov 2026"
        />
        <SupportNotice context="inferencia" />
      </div>
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('note')[1]).toHaveTextContent('apoyo, no diagnóstico');
    await expect(canvas.queryByText(/diagnóstico definitivo/i)).not.toBeInTheDocument();
  },
};

export const HistorialDeVersiones: Story = {
  render: () => (
    <Pagina descripcion="Muestra una secuencia cronológica de cambios de demostración.">
      <Timeline
        label="Historial de versiones"
        items={[
          {
            id: 'v1',
            title: 'Versión inicial',
            description: 'Registro creado para demostración.',
            timestamp: '1 jun 2026',
            dateTime: '2026-06-01',
          },
          {
            id: 'v2',
            title: 'Revisión profesional',
            description: 'Se actualizó el contenido sintético.',
            timestamp: '3 jun 2026',
            dateTime: '2026-06-03',
            tone: 'info',
          },
        ]}
      />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'Historial de versiones' })).toBeVisible();
    await expect(canvas.getByText('Revisión profesional')).toBeVisible();
  },
};
