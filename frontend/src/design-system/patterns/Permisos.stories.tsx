import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../index';
import { matrizRolesOk } from '../../mocks/handlers';
const permisoFaltante = matrizRolesOk.permisos.find(
  (permiso) =>
    !matrizRolesOk.roles.find((rol) => rol.nombre === 'medico')?.permisos.includes(permiso.codigo),
);

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Permisos" description={descripcion} />
      <Callout title="Regla funcional">
        El acceso es una regla funcional del backend (403). La interfaz no oculta la acción: muestra
        qué permiso falta.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Sistema de diseño/Patrones/Permisos',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MatrizDePermisos: Story = {
  render: () => (
    <Pagina descripcion="Relaciona roles sintéticos con los permisos disponibles.">
      <Table caption="Matriz de permisos de demostración">
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            {matrizRolesOk.permisos.map((permiso) => (
              <TableHead key={permiso.codigo}>{permiso.codigo}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrizRolesOk.roles.map((rol) => (
            <TableRow key={rol.id}>
              <TableHead scope="row">{rol.nombre}</TableHead>
              {matrizRolesOk.permisos.map((permiso) => (
                <TableCell key={permiso.codigo}>
                  {rol.permisos.includes(permiso.codigo) ? (
                    <Badge tone="success">Permitido</Badge>
                  ) : (
                    <Badge tone="neutral">No asignado</Badge>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('region', { name: 'Matriz de permisos de demostración' }),
    ).toBeVisible();
    await expect(canvas.getByText('admin')).toBeVisible();
  },
};

export const AccesoDenegado: Story = {
  render: () => (
    <Pagina descripcion="Explica el permiso que el rol actual necesita para continuar.">
      <Callout tone="danger" title="Acceso denegado" role="alert">
        Falta el permiso «{permisoFaltante?.codigo}».
      </Callout>
      <EmptyState
        as="h2"
        title="No puedes administrar roles"
        description={`Solicita el permiso ${permisoFaltante?.codigo} a una persona administradora.`}
        action={<Button variant="outline">Volver</Button>}
      />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent(permisoFaltante?.codigo ?? '');
    await expect(canvas.getByRole('button', { name: 'Volver' })).toBeVisible();
  },
};
