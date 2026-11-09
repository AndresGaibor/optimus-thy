import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../atoms/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Sistema de diseño/Moléculas/EmptyState',
  component: EmptyState,
  args: {
    title: 'No hay elementos de muestra',
    description: 'Cuando haya contenido sintético disponible, aparecerá en esta sección.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof EmptyState>;

export default meta;

export const Vacío: StoryObj<typeof meta> = {};
export const ConAcción: StoryObj<typeof meta> = {
  args: {
    title: 'Aún no hay elementos',
    description: 'Esta lista de demostración está vacía.',
    action: <Button variant="outline">Crear elemento de muestra</Button>,
  },
};
export const Playground: StoryObj<typeof meta> = {};
export const ContenidoLargo: StoryObj<typeof meta> = {
  args: {
    title:
      'Demostracionsinteticaparacomprobarqueeltitulodelestadovaciopermanecelegibleenuncontenedorestrechoyconmuchocontenidodemostracionsinteticadigitaldeejemplo',
    description:
      'Esta explicación de muestra permite observar cómo se acomoda una descripción extensa cuando el espacio disponible cambia. El mensaje usa contenido sintético, mantiene el propósito del estado vacío y ayuda a comprobar que la acción opcional permanece identificable y legible sin depender de datos personales o clínicos.',
  },
};
