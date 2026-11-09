import { useState } from 'react';
import {
  ConfusionMatrix,
  Callout,
  FilterBar,
  Select,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DemoErrorCategory } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { DemoMetricNote, ResearcherLayout, SectionCard, Severity } from './ResearcherBlocks';

export function ErrorAnalysis({
  categories,
  matrix,
}: {
  categories: DemoErrorCategory[];
  matrix: number[][];
}) {
  const [severity, setSeverity] = useState('Todas');
  const [query, setQuery] = useState('');
  const visible = categories.filter((c) => {
    const matchesSeverity = severity === 'Todas' || c.severidad === severity;
    const matchesQuery = c.tipo.toLowerCase().includes(query.toLowerCase());
    return matchesSeverity && matchesQuery;
  });
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Análisis de errores"
        description="Categorías ilustrativas para orientar revisión profesional."
      >
        <ResearcherLayout
          title="Patrones de revisión"
          description="Los conteos no representan desempeño real de modelos."
        >
          <DemoMetricNote />
          <Callout tone="warning" title="Impacto clínico">
            Los falsos negativos críticos requieren revisión profesional prioritaria; las cifras son
            ilustrativas.
          </Callout>
          <FilterBar label="Filtros por clase">
            <Select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              aria-label="Filtrar por severidad"
            >
              <option value="Todas">Todas las severidades</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </Select>
            <Input
              aria-label="Buscar categoría"
              placeholder="Buscar categoría"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </FilterBar>
          <SectionCard title="Matriz de confusión sintética">
            <ConfusionMatrix
              classes={['Referencia demo A', 'Referencia demo B']}
              values={matrix}
              caption="Matriz sintética"
            />
          </SectionCard>
          <SectionCard title="Falsos positivos y negativos">
            <div className="overflow-x-auto">
              <Table caption="Categorías de error">
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Proporción</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((c) => (
                    <TableRow key={c.tipo}>
                      <TableCell className="font-medium">{c.tipo}</TableCell>
                      <TableCell>{c.cantidad}</TableCell>
                      <TableCell>{c.porcentaje}%</TableCell>
                      <TableCell>
                        <Severity value={c.severidad} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.descripcion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {visible.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">
                No hay categorías para este filtro.
              </p>
            )}
          </SectionCard>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
