import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
  AiResultCard,
  Button,
  Callout,
  ConfidenceBadge,
  OcrField,
  PageHeader,
  SupportNotice,
  Timeline,
} from '../index';

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

export const ConfirmacionOcr: Story = {
  render: () => <ConfirmacionOcrForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Código de demostración' });
    await userEvent.clear(input);
    await userEvent.type(input, 'DEMO-204');
    await userEvent.click(canvas.getByRole('button', { name: 'Confirmar' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Valor confirmado: DEMO-204');
  },
};

function ConfirmacionOcrForm() {
  const [value, setValue] = useState('DEMO-204');
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Pagina descripcion="Revisa un dato extraído antes de confirmar su valor.">
      <div className="max-w-xl space-y-4">
        <OcrField
          label="Código de demostración"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setConfirmed(false);
          }}
          confidence={0.92}
          source="ocr"
        />
        <ConfidenceBadge value={92} label="Confianza de extracción" tone="info" />
        <Button onClick={() => setConfirmed(true)}>Confirmar</Button>
        {confirmed ? <p role="status">Valor confirmado: {value}</p> : null}
      </div>
    </Pagina>
  );
}

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
