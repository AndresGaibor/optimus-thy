import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, within } from 'storybook/test';
import { Callout, PageHeader } from '../../design-system';
import { ListaDetalle, type ListaDetalleItem } from './ListaDetalle';

const meta = {
  title: 'Sistema de diseño/Plantillas/Lista y detalle',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

const items: ListaDetalleItem[] = [
  {
    id: 'eco-001',
    titulo: 'Ecografía de control',
    detalle: 'Revisión comparativa de la muestra inicial.',
  },
  {
    id: 'lab-002',
    titulo: 'Perfil tiroideo',
    detalle: 'Resultados de laboratorio del último trimestre.',
  },
  {
    id: 'nota-003',
    titulo: 'Seguimiento clínico',
    detalle: 'Nota de evolución y próximos controles.',
  },
];

export const ConDatos: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Lista y detalle"
        description="Explora registros sintéticos y consulta el elemento seleccionado."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala cuando el usuario necesite recorrer una lista filtrable y revisar el detalle del
        registro elegido sin perder el contexto de la lista.
      </Callout>
      <ListaDetalle items={items} />
    </main>
  ),
};

export const SinDatos: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Lista y detalle"
        description="Explora registros sintéticos y consulta el elemento seleccionado."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala cuando el usuario necesite recorrer una lista filtrable y revisar el detalle del
        registro elegido sin perder el contexto de la lista.
      </Callout>
      <ListaDetalle items={[]} />
    </main>
  ),
};

export const SeleccionInicial: StoryObj<typeof meta> = {
  render: () => (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader
        title="Lista y detalle"
        description="Explora registros sintéticos y consulta el elemento seleccionado."
      />
      <Callout title="Cuándo usar esta plantilla">
        Úsala cuando el usuario necesite recorrer una lista filtrable y revisar el detalle del
        registro elegido sin perder el contexto de la lista.
      </Callout>
      <ListaDetalle items={items} />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole('button', { name: /Perfil tiroideo/ }));
    await expect(canvas.getByRole('heading', { name: 'Perfil tiroideo' })).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Historial' })).toBeVisible();
  },
};
