import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState, type ReactNode } from 'react';
import { Callout, PageHeader, Pagination } from '../index';

const meta = {
  title: 'Sistema de diseño/Patrones/Paginación',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const registros = Array.from(
  { length: 23 },
  (_, indice) => `DEMO-${String(indice + 1).padStart(4, '0')}`,
);
const limite = 10;

function ListaPaginada({
  total = registros.length,
  ocultarPáginaÚnica = false,
}: {
  total?: number;
  ocultarPáginaÚnica?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const elementos = registros.slice(offset, Math.min(offset + limite, total));
  return (
    <section className="max-w-2xl space-y-4" aria-label="Listado sintético paginado">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {total
          ? `Mostrando ${offset + 1}–${Math.min(offset + limite, total)} de ${total} registros`
          : 'No hay registros'}
      </p>
      <ul className="divide-y divide-border rounded-card border border-border">
        {elementos.map((codigo) => (
          <li key={codigo} className="p-3">
            Registro sintético {codigo}
          </li>
        ))}
      </ul>
      {!ocultarPáginaÚnica || total > limite ? (
        <Pagination
          total={total}
          limit={limite}
          offset={offset}
          onOffsetChange={setOffset}
          itemLabel="registro"
        />
      ) : null}
    </section>
  );
}

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Paginación" description={descripcion} />
      <Callout title="Cuándo no usarlo">
        No pagines una lista que cabe completa y se recorre con facilidad; ocultar la navegación
        cuando hay una sola página evita controles redundantes.
      </Callout>
      <Callout title="Regla de accesibilidad">
        Expón el rango visible y el total real, usa botones con nombres claros y comunica el cambio
        de página como contenido actualizado.
      </Callout>
      {children}
    </main>
  );
}

export const PorDesplazamiento: Story = {
  render: () => (
    <Pagina descripcion="Muestra registros por lotes con offset, total real y un rango visible que cambia al avanzar.">
      <ListaPaginada />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Mostrando 1–10 de 23 registros')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Siguiente' }));
    await expect(canvas.getByText('Mostrando 11–20 de 23 registros')).toBeInTheDocument();
    await expect(canvas.getByText('Registro sintético DEMO-0011')).toBeInTheDocument();
  },
};

export const PáginaÚnica: Story = {
  render: () => (
    <Pagina descripcion="En un conjunto pequeño, presenta el único lote sin navegación redundante.">
      <ListaPaginada total={1} ocultarPáginaÚnica />
    </Pagina>
  ),
};
