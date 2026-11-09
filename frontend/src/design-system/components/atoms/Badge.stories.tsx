import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Sistema de diseño/Átomos/Badge',
  component: Badge,
  args: { children: 'Demostración sintética' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Playground: Story = {};
export const ContenidoLargo: Story = {
  args: {
    children: `${'abcdefghijklmnopqrst'.repeat(6)} Esta frase sintética sirve para comprobar que el contenido se reorganiza en varias líneas, permanece legible y no se desborda cuando la superficie cambia de anchura entre una pantalla móvil, una tableta y un escritorio amplio durante la revisión visual del componente, sin ocultar ni recortar ningún carácter y manteniendo su lectura completa en el contenedor disponible.`,
    className: 'max-w-sm whitespace-normal break-all',
  },
};

export const Tonos: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(
        [
          ['neutral', 'Neutro'],
          ['info', 'Información'],
          ['success', 'Correcto'],
          ['warning', 'Pendiente'],
          ['attention', 'Atención'],
          ['danger', 'Error'],
          ['ai', 'Asistencia IA'],
        ] as const
      ).map(([tone, label]) => (
        <Badge {...args} key={tone} tone={tone}>
          {label}
        </Badge>
      ))}
    </div>
  ),
};
