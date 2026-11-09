import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import {
  Callout,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../index';

const meta = {
  title: 'Sistema de diseño/Patrones/Tablas y listados',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Tablas y listados" description={descripcion} />
      <Callout title="Cuándo no usarlo">
        No uses una tabla para contenido narrativo o pocos elementos sin relaciones entre columnas;
        una lista o tarjetas pueden comunicarlo mejor.
      </Callout>
      <Callout title="Regla de accesibilidad">
        Incluye un caption descriptivo, encabezados asociados, alineación coherente para números y
        acceso por teclado al contenedor desplazable. Los estados vacíos y de carga deben anunciarse
        con texto.
      </Callout>
      {children}
    </main>
  );
}

function TablaMuestras({
  modo = 'datos',
  densa = false,
}: {
  modo?: 'datos' | 'vacia' | 'cargando';
  densa?: boolean;
}) {
  const filas = densa
    ? [
        [
          'DEMO-0101',
          'Ecografía tiroidea',
          'Seguimiento',
          '14',
          '2026-10-21',
          'Unidad Norte',
          'Completo',
        ],
        ['DEMO-0102', 'Laboratorio', 'Consulta', '8', '2026-10-22', 'Unidad Centro', 'Pendiente'],
        [
          'DEMO-0103',
          'Ecografía tiroidea',
          'Seguimiento',
          '21',
          '2026-10-23',
          'Unidad Sur',
          'Completo',
        ],
      ]
    : [
        ['DEMO-0101', 'Ecografía tiroidea', '14', 'Completo'],
        ['DEMO-0102', 'Laboratorio', '8', 'Pendiente'],
        ['DEMO-0103', 'Ecografía tiroidea', '21', 'Completo'],
      ];
  const encabezados = densa
    ? ['Código', 'Estudio', 'Tipo', 'Días', 'Fecha', 'Unidad', 'Estado']
    : ['Código', 'Estudio', 'Días', 'Estado'];
  const caption =
    modo === 'vacia'
      ? 'Registros sintéticos sin resultados'
      : modo === 'cargando'
        ? 'Registros sintéticos en carga'
        : 'Registros sintéticos de ejemplo';
  return (
    <Table caption={caption} className={densa ? 'min-w-[48rem]' : undefined}>
      <TableHeader>
        <TableRow>
          {encabezados.map((titulo) => (
            <TableHead key={titulo} className={titulo === 'Días' ? 'text-right' : undefined}>
              {titulo}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {modo === 'vacia' ? (
          <TableRow>
            <TableCell colSpan={encabezados.length} className="py-8 text-center">
              No hay registros que coincidan con los criterios.
            </TableCell>
          </TableRow>
        ) : modo === 'cargando' ? (
          <TableRow>
            <TableCell colSpan={encabezados.length} className="py-8 text-center">
              <span className="inline-flex items-center gap-2">
                <Spinner label="Cargando registros" />
                Cargando registros de demostración…
              </span>
            </TableCell>
          </TableRow>
        ) : (
          filas.map((fila) => (
            <TableRow key={fila[0]}>
              {fila.map((celda, indice) => (
                <TableCell
                  key={`${fila[0]}-${indice}`}
                  className={encabezados[indice] === 'Días' ? 'text-right tabular-nums' : undefined}
                >
                  {celda}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export const ConDatos: Story = {
  render: () => (
    <Pagina descripcion="Presenta registros relacionados en columnas comparables con datos enteramente sintéticos.">
      <TablaMuestras />
    </Pagina>
  ),
};

export const Vacia: Story = {
  render: () => (
    <Pagina descripcion="Aclara que la búsqueda no produjo filas y cómo interpretar el estado vacío.">
      <TablaMuestras modo="vacia" />
    </Pagina>
  ),
};

export const Cargando: Story = {
  render: () => (
    <Pagina descripcion="Mantiene la estructura de la lista mientras los registros todavía se están cargando.">
      <TablaMuestras modo="cargando" />
    </Pagina>
  ),
};

export const Densa: Story = {
  render: () => (
    <Pagina descripcion="Conserva encabezados y permite desplazamiento horizontal cuando hay muchas columnas.">
      <TablaMuestras densa />
    </Pagina>
  ),
};
