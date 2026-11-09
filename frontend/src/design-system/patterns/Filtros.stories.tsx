import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState, type ReactNode } from 'react';
import { Badge, Callout, Field, FilterBar, PageHeader, Select } from '../index';

const meta = {
  title: 'Sistema de diseño/Patrones/Filtros',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const registros = [
  { codigo: 'DEMO-0201', tipo: 'Ecografía', estado: 'Pendiente', unidad: 'Norte' },
  { codigo: 'DEMO-0202', tipo: 'Laboratorio', estado: 'Completo', unidad: 'Centro' },
  { codigo: 'DEMO-0203', tipo: 'Ecografía', estado: 'Pendiente', unidad: 'Centro' },
];

function FiltrosInteractivos() {
  const [estado, setEstado] = useState('todos');
  const [tipo, setTipo] = useState('todos');
  const [unidad, setUnidad] = useState('todas');
  const filtrados = registros.filter(
    (registro) =>
      (estado === 'todos' || registro.estado.toLowerCase() === estado) &&
      (tipo === 'todos' || registro.tipo.toLowerCase() === tipo) &&
      (unidad === 'todas' || registro.unidad.toLowerCase() === unidad),
  );
  const filtrosActivos = [
    estado !== 'todos' ? `Estado: ${estado}` : '',
    tipo !== 'todos' ? `Tipo: ${tipo}` : '',
    unidad !== 'todas' ? `Unidad: ${unidad}` : '',
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <FilterBar
        label="Filtros de registros"
        onReset={() => {
          setEstado('todos');
          setTipo('todos');
          setUnidad('todas');
        }}
      >
        <Field label="Estado">
          <Select value={estado} onChange={(event) => setEstado(event.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="completo">Completo</option>
          </Select>
        </Field>
        <Field label="Tipo de estudio">
          <Select value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="todos">Todos</option>
            <option value="ecografía">Ecografía</option>
            <option value="laboratorio">Laboratorio</option>
          </Select>
        </Field>
        <Field label="Unidad">
          <Select value={unidad} onChange={(event) => setUnidad(event.target.value)}>
            <option value="todas">Todas</option>
            <option value="norte">Norte</option>
            <option value="centro">Centro</option>
          </Select>
        </Field>
      </FilterBar>
      {filtrosActivos.length ? (
        <ul aria-label="Filtros activos" className="flex flex-wrap gap-2">
          {filtrosActivos.map((filtro) => (
            <li key={filtro}>
              <Badge>{filtro}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sin filtros activos</p>
      )}
      <p aria-live="polite" className="text-sm font-medium">
        {filtrados.length} resultados
      </p>
      <ul className="divide-y divide-border rounded-card border border-border">
        {filtrados.length ? (
          filtrados.map((registro) => (
            <li key={registro.codigo} className="flex flex-wrap gap-x-4 gap-y-1 p-3">
              <span>{registro.codigo}</span>
              <span>{registro.tipo}</span>
              <span>{registro.estado}</span>
              <span>Unidad {registro.unidad}</span>
            </li>
          ))
        ) : (
          <li className="p-4 text-sm">No hay registros que coincidan con estos filtros.</li>
        )}
      </ul>
    </div>
  );
}

function Pagina({ descripcion, children }: { descripcion: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6">
      <PageHeader title="Filtros" description={descripcion} />
      <Callout title="Cuándo no usarlo">
        No conviertas cada preferencia en un filtro si una búsqueda simple o una lista breve
        resuelve la tarea; evita criterios ambiguos o difíciles de restablecer.
      </Callout>
      <Callout title="Regla de accesibilidad">
        Agrupa los controles bajo un nombre accesible, conserva etiquetas visibles, muestra los
        criterios activos en texto y anuncia el contador actualizado.
      </Callout>
      {children}
    </main>
  );
}

export const CriteriosActivos: Story = {
  render: () => (
    <Pagina descripcion="Combina criterios explícitos, identifica los filtros activos y muestra cuántos resultados cumplen las condiciones.">
      <FiltrosInteractivos />
    </Pagina>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText('Estado'), 'pendiente');
    await expect(canvas.getByText('Estado: pendiente')).toBeInTheDocument();
    await expect(canvas.getByText('2 resultados')).toBeInTheDocument();
  },
};
