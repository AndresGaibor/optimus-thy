import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Callout, PageHeader, SearchInput } from '../index';

const meta = {
  title: 'Sistema de diseño/Patrones/Búsqueda',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const registros = [
  { codigo: 'DEMO-0101', nombre: 'Ecografía tiroidea' },
  { codigo: 'DEMO-0102', nombre: 'Laboratorio sintético' },
  { codigo: 'DEMO-0103', nombre: 'Seguimiento de ejemplo' },
];

function Buscador({ inicial = '' }: { inicial?: string }) {
  const [consulta, setConsulta] = useState(inicial);
  const [consultaAplicada, setConsultaAplicada] = useState(inicial);
  useEffect(() => {
    const temporizador = window.setTimeout(() => setConsultaAplicada(consulta.trim()), 300);
    return () => window.clearTimeout(temporizador);
  }, [consulta]);
  const resultado = registros.filter(({ codigo, nombre }) =>
    `${codigo} ${nombre}`.toLowerCase().includes(consultaAplicada.toLowerCase()),
  );

  return (
    <section className="max-w-2xl space-y-4" aria-label="Búsqueda de registros sintéticos">
      <SearchInput
        label="Buscar registros sintéticos"
        placeholder="Código o nombre"
        value={consulta}
        onChange={(event) => setConsulta(event.target.value)}
        onClear={() => setConsulta('')}
      />
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {resultado.length} resultados · búsqueda con retardo de 300 ms
      </p>
      {resultado.length ? (
        <ul className="divide-y divide-border rounded-card border border-border">
          {resultado.map(({ codigo, nombre }) => (
            <li key={codigo} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <span>{nombre}</span>
              <Badge tone="neutral">{codigo}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="rounded-card border border-border p-4 text-sm">
          No hay resultados para “{consultaAplicada}”. Prueba con otro término o limpia la búsqueda.
        </p>
      )}
    </section>
  );
}

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Búsqueda" description={descripcion} />
      <Callout title="Cuándo no usarlo">
        No añadas búsqueda libre a conjuntos pequeños y estables que se entienden mejor con una
        lista completa; para datos sensibles, limita el alcance y evita sugerencias que revelen
        información.
      </Callout>
      <Callout title="Regla de accesibilidad">
        Da un nombre accesible al campo, anuncia el número de resultados y permite limpiar con un
        control de teclado claramente etiquetado.
      </Callout>
      {children}
    </main>
  );
}

export const Resultados: Story = {
  render: () => (
    <Pagina descripcion="Filtra una lista sintética por texto con una espera explícita de 300 ms antes de actualizar los resultados.">
      <Buscador />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Buscar registros sintéticos' }),
      'laboratorio',
    );
    await expect(await canvas.findByText('Laboratorio sintético')).toBeInTheDocument();
    await expect(
      await canvas.findByText('1 resultados · búsqueda con retardo de 300 ms'),
    ).toBeInTheDocument();
  },
};

export const SinResultados: Story = {
  render: () => (
    <Pagina descripcion="Explica qué ocurre si ningún dato coincide con la búsqueda aplicada.">
      <Buscador inicial="sin coincidencias" />
    </Pagina>
  ),
};

export const Limpiar: Story = {
  render: () => (
    <Pagina descripcion="Incluye una acción accesible para borrar la consulta y recuperar todos los resultados.">
      <Buscador inicial="DEMO-0101" />
    </Pagina>
  ),
};
