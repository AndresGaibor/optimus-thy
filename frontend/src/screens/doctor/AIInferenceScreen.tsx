import { useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  ScanViewport,
  Select,
  StatusBadge,
  TiradsBadge,
} from '../../design-system';
import type { DemoInference, DemoPatient } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
export interface AIInferenceScreenProps {
  patients: DemoPatient[];
  inferences: DemoInference[];
  onRequestInference: (patientId: string) => void;
  onReview: (id: string) => void;
}
export function AIInferenceScreen({
  patients,
  inferences,
  onRequestInference,
  onReview,
}: AIInferenceScreenProps) {
  const [patient, setPatient] = useState(''),
    [selected, setSelected] = useState<DemoInference | null>(null),
    [limitsOpen, setLimitsOpen] = useState(false);
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Inferencia de IA"
        description="Herramientas de apoyo para revisión profesional; no generan diagnósticos."
      >
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Preparar una revisión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona un registro sintético para solicitar una evaluación posterior. Esta
                demostración no ejecuta modelos.
              </p>
              <label className="block text-sm font-medium">
                Paciente
                <Select
                  containerClassName="mt-2"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                >
                  <option value="">Seleccionar paciente…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · {p.id}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Entrada
                <Select containerClassName="mt-2">
                  <option>Ecografía sintética</option>
                  <option>Datos sintéticos</option>
                </Select>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!patient} onClick={() => patient && onRequestInference(patient)}>
                  Solicitar revisión
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={limitsOpen}
                  aria-controls="limites-modelo"
                  onClick={() => setLimitsOpen((v) => !v)}
                >
                  ¿Cómo funciona?
                </Button>
              </div>
              {limitsOpen && (
                <section id="limites-modelo" aria-label="Límites del modelo" className="space-y-2">
                  <Callout tone="info" title="Flujo y límites del modelo">
                    El modelo recibe la imagen elegida y datos sintéticos, genera una sugerencia de
                    categoría y confianza ilustrativa, y deja el resultado para revisión. Tiene
                    límites: puede equivocarse, depende de la calidad de la imagen y no reemplaza la
                    evaluación clínica. No diagnostica ni indica tratamiento.
                  </Callout>
                </section>
              )}
              <p className="text-xs text-muted-foreground">
                Sin cargas, ejecución ni cambios de datos en esta pantalla.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h2">Cola e inferencias de apoyo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inferences.map((x) => (
                <div
                  key={x.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle p-4"
                >
                  <div>
                    <p className="font-medium">
                      {x.pacienteNombre}{' '}
                      <span className="font-normal text-muted-foreground">· {x.id}</span>
                    </p>
                    <p className="text-sm">{x.resultado}</p>
                    <p className="text-xs text-muted-foreground">
                      {x.modelo} · {x.fecha} · Confianza ilustrativa {x.confianza}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge kind="inference" status={x.estado} />
                    <Button size="sm" variant="outline" onClick={() => setSelected(x)}>
                      Revisar
                    </Button>
                  </div>
                </div>
              ))}
              {inferences.length === 0 && (
                <EmptyState
                  title="No hay inferencias"
                  description="Las entradas de apoyo aparecerán aquí cuando existan datos sintéticos."
                />
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Vista sintética</CardTitle>
          </CardHeader>
          <CardContent>
            <ScanViewport label="Vista vectorial de demostración" />
            <p className="mt-3 text-sm text-muted-foreground">
              La visualización es esquemática y no representa una ecografía.
            </p>
          </CardContent>
        </Card>
        <Dialog
          open={Boolean(selected)}
          onOpenChange={(open) => !open && setSelected(null)}
          title="Revisión profesional"
          description="La IA apoya la lectura; la interpretación y decisión corresponden al profesional."
        >
          <div className="space-y-3">
            <p>
              {selected?.resultado.toLowerCase().includes('sin nódulo') ? (
                <>
                  <strong>Normal:</strong> sin nódulo detectado.
                </>
              ) : (
                selected?.resultado
              )}
            </p>
            <p>
              Confianza ilustrativa: {selected?.confianza}% · Incertidumbre ilustrativa:{' '}
              {selected?.incertidumbre}%
            </p>
            <TiradsBadge value={selected?.tiRads ?? '—'} />
            <Button onClick={() => selected && onReview(selected.id)}>
              Marcar para revisión profesional
            </Button>
          </div>
        </Dialog>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
