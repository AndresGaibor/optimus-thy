import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import {
  Badge,
  Callout,
  ImageViewer,
  PageHeader,
  PatientCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '..';

const textoExtenso = 'TextoSintetico'.repeat(24);
const nombreExtenso = 'NombreSintético '.repeat(8);
const filas = Array.from({ length: 200 }, (_, index) => ({
  codigo: `DEMO-${String(index + 1).padStart(3, '0')}`,
  estado: index % 2 === 0 ? 'Pendiente' : 'Revisado',
}));

function CalidadLayout({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Estados y casos límite" description={descripcion} />
      <Callout title="Datos sintéticos">
        Estos casos comprueban presentación y desbordamiento, no contienen datos clínicos reales.
      </Callout>
      {children}
    </main>
  );
}

const meta = {
  title: 'Guías y calidad/Estados y casos límite',
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextoLargoSinEspacios: Story = {
  render: () => (
    <CalidadLayout descripcion="Comprueba que una cadena larga pueda partirse dentro del contenedor.">
      <p className="max-w-xl break-all text-sm" data-testid="texto-largo">
        {textoExtenso}
      </p>
      <p className="max-w-xl text-sm">
        Este contenido incluye una frase sintética de longitud considerable para comprobar el ajuste
        dentro del ancho disponible sin alterar el diseño.
      </p>
    </CalidadLayout>
  ),
  play: async ({ canvasElement }) => {
    const el = within(canvasElement).getByTestId('texto-largo');
    await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  },
};

export const ListaVaciaYListaMuyLarga: Story = {
  render: () => (
    <CalidadLayout descripcion="Compara una tabla sin filas con otra que contiene muchos registros sintéticos.">
      <div className="space-y-5">
        <Table caption="Lista vacía de demostración">
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody />
        </Table>
        <Table caption="Lista extensa de demostración">
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => (
              <TableRow key={fila.codigo}>
                <TableCell>{fila.codigo}</TableCell>
                <TableCell>{fila.estado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CalidadLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Lista vacía de demostración' })).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(202);
  },
};

export const NombreMuyLargo: Story = {
  render: () => (
    <CalidadLayout descripcion="Comprueba nombres sintéticos extensos en tarjeta y distintivo.">
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Paciente de demostración</h2>
        <PatientCard
          pseudonym={nombreExtenso}
          ageRange="40–49 años"
          institution="Institución de demostración"
          caseStatus="Completa"
        />
        <Badge className="whitespace-normal">{nombreExtenso}</Badge>
      </div>
    </CalidadLayout>
  ),
  play: async ({ canvasElement }) => {
    const main = within(canvasElement).getByRole('main');
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth + 1);
  },
};

export const SinImagen: Story = {
  render: () => (
    <CalidadLayout descripcion="Presenta el estado vacío cuando no hay imagen disponible.">
      <div className="max-w-2xl">
        <ImageViewer />
      </div>
    </CalidadLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('No hay una imagen disponible.');
  },
};
