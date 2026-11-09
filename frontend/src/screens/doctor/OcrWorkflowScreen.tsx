import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  Field,
  FileDropzone,
  Progress,
  Select,
  StatusBadge,
  Timeline,
  type InferenceStatus,
  type RecordStatus,
} from '../../design-system';
import type { TimelineItem } from '../../design-system';
import type { DocumentoCasoDemo, IntentoOcrDemo, OcrEstado } from '../fixtures/documentos-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';

export interface OcrWorkflowScreenProps {
  document: DocumentoCasoDemo;
  attempts: IntentoOcrDemo[];
  /** Estado inicial y secuencia de transición para la historia. */
  initialState?: OcrEstado;
  flow?: OcrEstado[];
  lowQuality?: boolean;
}

const ORDEN: Record<OcrEstado, number> = { 'En cola': 0, Procesando: 1, Listo: 2, Error: 2 };
const PROGRESO: Record<OcrEstado, number> = {
  'En cola': 15,
  Procesando: 60,
  Listo: 100,
  Error: 100,
};
const MENSAJE: Record<OcrEstado, string> = {
  'En cola': 'El documento espera turno para procesamiento OCR.',
  Procesando: 'Extrayendo texto y campos del documento.',
  Listo: 'La lectura terminó y está disponible para revisión.',
  Error: 'La lectura falló. Revisa el motivo y reintenta.',
};

function BadgeEstado({ estado }: { estado: OcrEstado }) {
  if (estado === 'Listo')
    return <StatusBadge kind="record" status={'Completa' satisfies RecordStatus} />;
  if (estado === 'Procesando')
    return <StatusBadge kind="inference" status={'En proceso' satisfies InferenceStatus} />;
  if (estado === 'Error')
    return <StatusBadge kind="inference" status={'Error' satisfies InferenceStatus} />;
  return <StatusBadge kind="inference" status={'En cola' satisfies InferenceStatus} />;
}

export function OcrWorkflowScreen({
  document,
  attempts,
  initialState = 'En cola',
  flow = [],
  lowQuality = false,
}: OcrWorkflowScreenProps) {
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState(attempts);
  const [qualityAction, setQualityAction] = useState<'pendiente' | 'continuar' | 'reemplazar'>(
    lowQuality ? 'pendiente' : 'continuar',
  );
  const estado = flow[step] ?? initialState;
  const next = flow[step + 1];
  const items: TimelineItem[] = history.map((a) => ({
    id: a.id,
    title: `${a.resultado}${a.motivo ? `: ${a.motivo}` : ''}`,
    timestamp: a.fecha,
    tone: a.resultado === 'Error' ? 'danger' : a.resultado === 'Éxito' ? 'success' : 'info',
  }));
  const reintentar = () => {
    const intento: IntentoOcrDemo = {
      id: `DEMO-OCR-INT-${history.length + 3}`,
      documentoId: document.id,
      fecha: '2026-03-18 10:40',
      resultado: 'En curso',
      motivo: 'Reintento solicitado por el usuario.',
    };
    setHistory((h) => [intento, ...h]);
    if (next) setStep((s) => s + 1);
  };
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Flujo OCR"
        description={`Estado del procesamiento OCR para ${document.nombre}. Se actualiza sin recargar.`}
      >
        {qualityAction === 'pendiente' && (
          <Callout tone="warning" role="alert" title="Baja calidad del escaneo">
            <p>
              El escaneo tiene baja legibilidad. Puedes continuar con menor confianza o reemplazar
              el archivo.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setQualityAction('continuar')}>
                Continuar igual
              </Button>
              <Button size="sm" variant="outline" onClick={() => setQualityAction('reemplazar')}>
                Reemplazar archivo
              </Button>
            </div>
          </Callout>
        )}
        {qualityAction === 'reemplazar' && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">Reemplazar archivo</p>
              <FileDropzone
                accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
                label="Seleccionar un escaneo de mejor calidad"
                onFiles={() => setQualityAction('continuar')}
              />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{document.nombre}</p>
              <Badge tone="neutral">{document.tipo}</Badge>
              <BadgeEstado estado={estado} />
              <span className="text-sm text-muted-foreground">
                {document.id} · {document.subidoPor}
              </span>
            </div>
            <Field label="Estado actual">
              <Select value={estado} aria-label="Estado OCR" onChange={() => {}}>
                {(['En cola', 'Procesando', 'Listo', 'Error'] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Progress
              label="Progreso del OCR"
              value={PROGRESO[estado]}
              aria-label={`Progreso OCR ${PROGRESO[estado]}%`}
            />
            <p className="text-sm text-muted-foreground">
              {MENSAJE[estado]}
              {document.motivoError && estado === 'Error' ? ` Motivo: ${document.motivoError}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (next) setStep((s) => s + 1);
                }}
                disabled={!next || qualityAction !== 'continuar'}
              >
                Actualizar estado
              </Button>
              {estado === 'Error' && (
                <Button onClick={reintentar} disabled={qualityAction !== 'continuar'}>
                  Reintentar OCR
                </Button>
              )}
              {ORDEN[estado] >= 1 && next && (
                <span className="self-center text-xs text-muted-foreground">Siguiente: {next}</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-semibold">Historial de intentos</p>
            {items.length ? (
              <Timeline items={items} label="Historial de intentos OCR" />
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay intentos registrados.</p>
            )}
          </CardContent>
        </Card>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
