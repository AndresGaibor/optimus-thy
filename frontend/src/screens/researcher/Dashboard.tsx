import {
  StatusBadge,
  ConfidenceBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DemoErrorCategory, DemoModelMetric } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { MetricStats, ResearcherLayout, SectionCard } from './ResearcherBlocks';

export function Dashboard({
  metrics,
  errors,
}: {
  metrics: DemoModelMetric[];
  errors: DemoErrorCategory[];
}) {
  const total = metrics.reduce((n, x) => n + x.casos, 0);
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Dashboard — Investigador"
        description="Resumen de actividad y revisión de datos sintéticos."
      >
        <ResearcherLayout
          title="Actividad de investigación"
          description="Vista general de material ilustrativo para análisis."
        >
          <MetricStats
            items={[
              { label: 'Modelos de demostración', value: metrics.length },
              { label: 'Casos ilustrativos', value: total },
              { label: 'Categorías de revisión', value: errors.length },
              { label: 'Datos disponibles', value: 'Sintéticos' },
            ]}
          />
          <SectionCard title="Experimentos recientes">
            <div className="overflow-x-auto">
              <Table caption="Experimentos sintéticos recientes">
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Casos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.modelo}>
                      <TableCell className="font-medium">{m.modelo}</TableCell>
                      <TableCell>{m.casos}</TableCell>
                      <TableCell>
                        <StatusBadge kind="inference" status="Completado" />
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge value={m.accuracy} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
          <SectionCard title="Datasets pendientes">
            <p className="text-sm text-muted-foreground">
              {errors.length} categorías de revisión pendientes de análisis.
            </p>
          </SectionCard>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
