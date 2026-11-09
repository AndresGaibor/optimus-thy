import { useState } from 'react';
import {
  Input,
  Badge,
  EmptyState,
  Dialog,
  DialogClose,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ConfidenceBadge,
} from '../../design-system';
import type { DemoAIModel } from '../fixtures/researcher';
import type { DemoAuditCase } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { DemoMetricNote, ResearcherLayout, SectionCard } from './ResearcherBlocks';

export function ModelAudit({
  cases,
  modelCatalog = [],
}: {
  cases: DemoAuditCase[];
  modelCatalog?: DemoAIModel[];
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DemoAuditCase | null>(null);
  const rows = cases.filter((x) =>
    `${x.id} ${x.modelo} ${x.observacion}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Auditoría de modelos"
        description="Revisión de ejemplos sintéticos; no representa diagnóstico ni validación clínica."
      >
        <ResearcherLayout
          title="Casos para revisión"
          description="Contrasta resultados ilustrativos con la anotación de demostración."
        >
          <DemoMetricNote />
          {modelCatalog.length > 0 && (
            <SectionCard title="Catálogo de modelos">
              <div className="overflow-x-auto">
                <Table caption="Catálogo sintético de modelos">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}
          <Input
            aria-label="Buscar caso o modelo"
            placeholder="Buscar caso o modelo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SectionCard title={`Casos revisables (${rows.length})`}>
            {rows.length ? (
              <div className="overflow-x-auto">
                <Table caption="Auditoría de modelos">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Caso demo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Predicción</TableHead>
                      <TableHead>Verdad clínica</TableHead>
                      <TableHead>Concordancia</TableHead>
                      <TableHead>Confianza</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.id}</TableCell>
                        <TableCell>{c.modelo}</TableCell>
                        <TableCell>{c.prediccion}</TableCell>
                        <TableCell>{c.revision}</TableCell>
                        <TableCell>
                          <Badge tone={c.coincide ? 'success' : 'warning'}>
                            {c.coincide ? 'Coincide' : 'Discrepa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ConfidenceBadge value={c.confianza} />
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setSelected(c)}>
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="Sin coincidencias"
                description="Prueba con otro término de búsqueda."
              />
            )}
          </SectionCard>
          {selected && (
            <Dialog
              open
              onOpenChange={(open) => !open && setSelected(null)}
              size="lg"
              title={selected.id}
              description="Detalle sintético del caso auditado."
              footer={
                <DialogClose asChild>
                  <Button>Cerrar</Button>
                </DialogClose>
              }
            >
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">Modelo:</span> {selected.modelo}
                </p>
                <p>
                  <span className="font-medium">Predicción:</span> {selected.prediccion}
                </p>
                <p>
                  <span className="font-medium">Revisión:</span> {selected.revision}
                </p>
                <p>
                  <span className="font-medium">Fecha:</span> {selected.fecha}
                </p>
                <p>
                  <span className="font-medium">Observación:</span> {selected.observacion}
                </p>
              </div>
            </Dialog>
          )}
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
