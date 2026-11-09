import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

const meta = {
  title: 'Sistema de diseño/Átomos/Card',
  component: Card,
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};

export const ConSubcomponentes: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle as="h2">Encabezado de tarjeta</CardTitle>
        <CardDescription>Descripción breve en español.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Contenido principal de demostración.</p>
      </CardContent>
      <CardFooter>
        <span className="text-sm text-muted-foreground">Pie de tarjeta</span>
      </CardFooter>
    </Card>
  ),
};
export const ContenidoLargo: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardContent>
        <p className="break-all">
          {'abcdefghijklmnopqrst'.repeat(6)}{' '}
          {
            'Esta frase sintética sirve para comprobar que el contenido se reorganiza en varias líneas, permanece legible y no se desborda cuando la superficie cambia de anchura entre una pantalla móvil, una tableta y un escritorio amplio durante la revisión visual del componente, sin ocultar ni recortar ningún carácter y manteniendo su lectura completa en el contenedor disponible.'
          }
        </p>
      </CardContent>
    </Card>
  ),
};
