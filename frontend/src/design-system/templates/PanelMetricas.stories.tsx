import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout, PageHeader } from '../../design-system';
import { PanelMetricas } from './PanelMetricas';

const meta = {
  title: 'Sistema de diseño/Plantillas/Panel de métricas',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

const metricas = [
  { label: 'Casos revisados', value: '128' },
  { label: 'En seguimiento', value: '24' },
  { label: 'Revisados hoy', value: '18' },
  { label: 'Pendientes', value: '7' },
];

export const ConDatos: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Panel de métricas"
        description="Resumen de actividad y tendencias con datos sintéticos."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala para combinar indicadores resumidos con una tendencia y una tabla, manteniendo estados
        de carga y error independientes por panel.
      </Callout>
      <PanelMetricas metricas={metricas} />
    </main>
  ),
};

export const UnPanelConError: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Panel de métricas"
        description="Resumen de actividad y tendencias con datos sintéticos."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala para combinar indicadores resumidos con una tendencia y una tabla, manteniendo estados
        de carga y error independientes por panel.
      </Callout>
      <PanelMetricas metricas={metricas} panelError />
    </main>
  ),
};

export const Cargando: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Panel de métricas"
        description="Resumen de actividad y tendencias con datos sintéticos."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala para combinar indicadores resumidos con una tendencia y una tabla, manteniendo estados
        de carga y error independientes por panel.
      </Callout>
      <PanelMetricas metricas={metricas} cargando />
    </main>
  ),
};
