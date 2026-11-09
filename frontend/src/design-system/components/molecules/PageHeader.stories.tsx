import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../atoms/Button';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Sistema de diseño/Moléculas/PageHeader',
  component: PageHeader,
  args: {
    eyebrow: 'Área de demostración',
    title: 'Resumen de actividad',
    description: 'Contenido sintético para ilustrar la jerarquía de una cabecera.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof PageHeader>;

export default meta;

export const Predeterminado: StoryObj<typeof meta> = {};
export const ConAcciones: StoryObj<typeof meta> = {
  args: { actions: <Button>Acción de muestra</Button> },
};
export const ContenidoLargo: StoryObj<typeof meta> = {
  args: {
    title:
      'Demostracionsinteticaparacomprobarqueeltitulodelapaginapermanecelegiblecuandoelanchodisponibleesreducidodemostracionsinteticadigitaldeejemplo',
    description:
      'Esta descripción extensa explica el propósito de la pantalla y permite observar cómo se reorganiza junto a las acciones disponibles. Su contenido es sintético, no incluye información de pacientes y sirve para comprobar el ajuste de líneas en distintos tamaños sin perder la jerarquía del encabezado. La demostración puede leerse sin depender del color y conserva visible el nombre principal de la página.',
  },
};
