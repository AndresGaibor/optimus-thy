import type { Meta, StoryObj } from '@storybook/react';
import { Activity, CircleCheck, Clock3 } from 'lucide-react';
import { StatCard } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/StatCard',
  component: StatCard,
  args: {
    label: 'Registros de demostración',
    value: '128',
    description: 'Demostración sintética; no representa datos reales.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Predeterminada: Story = { args: { icon: Activity, tone: 'neutral' } };
export const TonoInformativo: Story = {
  args: {
    label: 'Registros informativos',
    value: '128',
    description: 'Cifra sintética de ejemplo.',
    icon: Activity,
    tone: 'info',
  },
};
export const TonoCorrecto: Story = {
  args: {
    label: 'Elementos completos',
    value: '24',
    description: 'Cifra sintética de ejemplo.',
    icon: CircleCheck,
    tone: 'success',
  },
};
export const TonoPendiente: Story = {
  args: {
    label: 'Elementos en espera',
    value: '3',
    description: 'Cifra sintética de ejemplo.',
    icon: Clock3,
    tone: 'warning',
  },
};
export const Playground: Story = {};
export const ContenidoLargo: Story = {
  args: {
    label:
      'Demostracionsinteticaparaverificarqueunaetiquetamuyextensapuedaajustarseenunatarjetademetricasdemostracionsinteticadigitaldeejemplo',
    description:
      'Este contexto de ejemplo explica que la cifra es ficticia y permite comprobar cómo se acomoda una descripción prolongada debajo del valor. La tarjeta conserva la relación entre la etiqueta, la métrica y su explicación sin convertir el dato visual en una afirmación clínica ni real. El contenido adicional permite revisar el ajuste de texto en la tarjeta con información de muestra, sin presentar datos de pacientes.',
  },
};
