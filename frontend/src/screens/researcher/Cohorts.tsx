import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DemoCohort } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout, SectionCard } from './ResearcherBlocks';

export function Cohorts({
  cohorts,
  onExplore,
}: {
  cohorts: DemoCohort[];
  onExplore: (id: string) => void;
}) {
  const total = cohorts.reduce((n, c) => n + c.pacientes, 0);
  const normal = Math.round(total * 0.6);
  const benigno = Math.round(total * 0.25);
  const maligno = total - normal - benigno;
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Cohortes"
        description="Agrupaciones ficticias para explorar metadatos de demostración."
        actions={<Button variant="outline">Exportar</Button>}
      >
        <ResearcherLayout
          title="Grupos de análisis"
          description="Sin datos personales ni registros clínicos reales."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Criterios de inclusión">
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                <li>Registros sintéticos con metadatos completos.</li>
                <li>Clasificación TI-RADS disponible.</li>
                <li>Seguimiento de demostración.</li>
              </ul>
            </SectionCard>
            <SectionCard title="Criterios de exclusión">
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                <li>Casos sin anotación de demostración.</li>
                <li>Registros incompletos o duplicados.</li>
                <li>Datos no desidentificados.</li>
              </ul>
            </SectionCard>
          </div>
          <SectionCard title="Resumen por clase">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border p-3 text-sm">
                <p className="font-medium">Normal</p>
                <p className="text-muted-foreground">{normal} casos</p>
              </div>
              <div className="rounded-card border p-3 text-sm">
                <p className="font-medium">Benigno</p>
                <p className="text-muted-foreground">{benigno} casos</p>
              </div>
              <div className="rounded-card border p-3 text-sm">
                <p className="font-medium">Maligno</p>
                <p className="text-muted-foreground">{maligno} casos</p>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Cohortes">
            <div className="overflow-x-auto">
              <Table caption="Cohortes sintéticas">
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohorte</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Inferencias</TableHead>
                    <TableHead>TI-RADS</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohorts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.pacientes}</TableCell>
                      <TableCell>{c.inferencias}</TableCell>
                      <TableCell>{c.tiRads}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => onExplore(c.id)}>
                          Explorar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
