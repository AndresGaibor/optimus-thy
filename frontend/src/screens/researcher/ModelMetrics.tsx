import { useState } from 'react';
import {
  Badge,
  ConfusionMatrix,
  TrendBars,
  Input,
  FilterBar,
  Select,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DemoAIModel } from '../fixtures/researcher';
import type { DemoModelMetric, DemoTrendGroup } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { DemoMetricNote, ResearcherLayout, SectionCard } from './ResearcherBlocks';

export function ModelMetrics({
  metrics,
  trend,
  matrix,
  modelCatalog = [],
}: {
  metrics: DemoModelMetric[];
  trend: DemoTrendGroup[];
  matrix: number[][];
  modelCatalog?: DemoAIModel[];
}) {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState(metrics[0]?.modelo ?? '');
  const visible = metrics.filter((x) => x.modelo.toLowerCase().includes(query.toLowerCase()));
  const tp = matrix[0]?.[0] ?? 0;
  const fp = matrix[0]?.[1] ?? 0;
  const fn = matrix[1]?.[0] ?? 0;
  const tn = matrix[1]?.[1] ?? 0;
  const sensitivity = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
  const specificity = tn + fp > 0 ? (tn / (tn + fp)) * 100 : 0;
  const accuracy = metrics.length
    ? metrics.reduce((n, m) => n + m.accuracy, 0) / metrics.length
    : 0;
  const auc = metrics.length ? metrics.reduce((n, m) => n + (m.auc ?? 0), 0) / metrics.length : 0;
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Métricas de modelos"
        description="Comparación descriptiva de conjuntos sintéticos."
      >
        <ResearcherLayout
          title="Lectura de métricas"
          description="Explora valores de demostración sin inferir rendimiento clínico."
        >
          <DemoMetricNote />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Exactitud" value={`${accuracy.toFixed(1)}%`} />
            <StatCard label="Sensibilidad" value={`${sensitivity.toFixed(1)}%`} />
            <StatCard label="Especificidad" value={`${specificity.toFixed(1)}%`} />
            <StatCard label="AUC" value={auc.toFixed(3)} />
          </div>
          <FilterBar label="Selector de modelo">
            <Select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Seleccionar modelo"
            >
              {metrics.map((m) => (
                <option key={m.modelo} value={m.modelo}>
                  {m.modelo}
                </option>
              ))}
            </Select>
            <Input
              aria-label="Buscar modelo"
              placeholder="Buscar modelo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </FilterBar>
          <SectionCard title="Tendencias ilustrativas">
            <DemoMetricNote />
            <TrendBars
              caption="Tendencia ilustrativa"
              items={trend.flatMap((g) =>
                g.valores.map((value, i) => ({
                  label: `${g.modelo} · ${i + 1}`,
                  value,
                  valueLabel: `${value}%`,
                  tone: 'info' as const,
                })),
              )}
            />
          </SectionCard>
          <SectionCard title="Matriz de confusión sintética">
            <DemoMetricNote />
            <ConfusionMatrix
              classes={['Referencia demo A', 'Referencia demo B']}
              values={matrix}
              caption="Matriz sintética"
            />
          </SectionCard>
          <SectionCard title="Comparación por clase">
            <DemoMetricNote />
            <div className="overflow-x-auto">
              <Table caption="Métricas por clase">
                <TableHeader>
                  <TableRow>
                    <TableHead>Clase</TableHead>
                    <TableHead>Precisión</TableHead>
                    <TableHead>Recall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Normal</TableCell>
                    <TableCell>{visible.length ? visible[0]?.precision : 0}%</TableCell>
                    <TableCell>{visible.length ? visible[0]?.recall : 0}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Benigno</TableCell>
                    <TableCell>
                      {visible.length ? (visible[1]?.precision ?? visible[0]?.precision) : 0}%
                    </TableCell>
                    <TableCell>
                      {visible.length ? (visible[1]?.recall ?? visible[0]?.recall) : 0}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Maligno</TableCell>
                    <TableCell>
                      {visible.length ? (visible[2]?.precision ?? visible[0]?.precision) : 0}%
                    </TableCell>
                    <TableCell>
                      {visible.length ? (visible[2]?.recall ?? visible[0]?.recall) : 0}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </SectionCard>
          <SectionCard title="Comparación de modelos">
            <DemoMetricNote />
            <Table caption="Métricas sintéticas por modelo">
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo sintético</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Precisión</TableHead>
                  <TableHead>Recall</TableHead>
                  <TableHead>F1</TableHead>
                  <TableHead>Casos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((m) => (
                  <TableRow key={m.modelo}>
                    <TableCell className="font-medium">{m.modelo}</TableCell>
                    <TableCell>{m.accuracy}%</TableCell>
                    <TableCell>{m.precision}%</TableCell>
                    <TableCell>{m.recall}%</TableCell>
                    <TableCell>{m.f1}%</TableCell>
                    <TableCell>{m.casos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {visible.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">
                No hay modelos para esta búsqueda.
              </p>
            )}
          </SectionCard>
          {modelCatalog.length > 0 && (
            <SectionCard title="Catálogo de modelos">
              <DemoMetricNote />
              <div className="overflow-x-auto">
                <Table caption="Catálogo sintético de modelos">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Exactitud</TableHead>
                      <TableHead>Sensibilidad</TableHead>
                      <TableHead>Especificidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelCatalog.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nombre}</TableCell>
                        <TableCell>v{m.version}</TableCell>
                        <TableCell>{m.tipo}</TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              m.estado === 'activo'
                                ? 'success'
                                : m.estado === 'beta'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {m.estado === 'activo'
                              ? 'Activo'
                              : m.estado === 'beta'
                                ? 'En prueba'
                                : 'Deprecado'}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.accuracy}%</TableCell>
                        <TableCell>{m.sensitivity}%</TableCell>
                        <TableCell>{m.specificity}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
