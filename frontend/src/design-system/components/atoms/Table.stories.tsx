import type { Meta, StoryObj } from '@storybook/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

const meta = {
  title: 'Sistema de diseño/Átomos/Table',
  component: Table,
  args: { caption: 'Elementos de demostración sintética' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Table>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Elemento</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Origen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Elemento alfa</TableCell>
          <TableCell>Disponible</TableCell>
          <TableCell>Catálogo base</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Elemento beta</TableCell>
          <TableCell>En revisión</TableCell>
          <TableCell>Registro interno</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Elemento gamma</TableCell>
          <TableCell>Archivado</TableCell>
          <TableCell>Referencia externa</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Vacía: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Elemento</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
            Sin elementos para mostrar
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const FilaSeleccionada: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Elemento</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow aria-selected="true">
          <TableCell>Elemento seleccionado</TableCell>
          <TableCell>Disponible</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
