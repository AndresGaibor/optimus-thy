import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

const meta = {
  title: 'Sistema de diseño/Átomos/Tabs',
  component: Tabs,
  args: { defaultValue: 'resumen' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Tabs>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Secciones de ejemplo">
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="detalles">Detalles</TabsTrigger>
      </TabsList>
      <TabsContent value="resumen">Contenido de resumen.</TabsContent>
      <TabsContent value="detalles">Contenido de detalles.</TabsContent>
    </Tabs>
  ),
};
export const PestañaSeleccionada: Story = {
  render: () => (
    <Tabs defaultValue="detalles">
      <TabsList aria-label="Secciones de ejemplo">
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="detalles">Detalles</TabsTrigger>
        <TabsTrigger value="historial" disabled>
          Historial no disponible
        </TabsTrigger>
      </TabsList>
      <TabsContent value="resumen">Resumen.</TabsContent>
      <TabsContent value="detalles">Detalles seleccionados.</TabsContent>
      <TabsContent value="historial">Historial.</TabsContent>
    </Tabs>
  ),
};
export const Playground: Story = {};
