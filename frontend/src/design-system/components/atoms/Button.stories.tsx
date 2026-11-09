import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Sistema de diseño/Átomos/Button',
  component: Button,
  args: { children: 'Guardar cambios' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Variantes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Predeterminado</Button>
      <Button variant="secondary">Secundario</Button>
      <Button variant="outline">Contorno</Button>
      <Button variant="ghost">Discreto</Button>
      <Button variant="link">Enlace</Button>
      <Button variant="destructive">Eliminar</Button>
    </div>
  ),
};

export const Tamaños: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeño</Button>
      <Button size="default">Normal</Button>
      <Button size="lg">Grande</Button>
      <Button size="icon" aria-label="Añadir">
        +
      </Button>
    </div>
  ),
};

export const Estados: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Disponible</Button>
      <Button disabled>Deshabilitado</Button>
      <Button loading>Cargando</Button>
    </div>
  ),
};
export const Playground: Story = {};
export const ContenidoLargo: Story = {
  args: {
    children: `${'abcdefghijklmnopqrst'.repeat(6)} Esta frase sintética sirve para comprobar que el contenido se reorganiza en varias líneas, permanece legible y no se desborda cuando la superficie cambia de anchura entre una pantalla móvil, una tableta y un escritorio amplio durante la revisión visual del componente, sin ocultar ni recortar ningún carácter y manteniendo su lectura completa en el contenedor disponible.`,
    className: 'h-auto w-full max-w-sm whitespace-normal break-all',
  },
};
