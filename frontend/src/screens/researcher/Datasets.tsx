import { useId, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Callout,
  Dialog,
  DialogClose,
  Field,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../../design-system';
import type { DemoDataset, DemoDatasetRequest } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout } from './ResearcherBlocks';

const REQUEST_HINTS: Record<DemoDatasetRequest['estado'], string> = {
  pendiente: 'En espera de revisión por un administrador demo.',
  aprobado: 'Aprobada: la muestra sintética puede presentarse.',
  rechazado: 'Rechazada: no hay muestra disponible para esta solicitud.',
};

function previewRows(d: DemoDataset): [string, string][] {
  return [
    ['Identificador', d.id],
    ['Formato', d.formato],
    ['Tamaño', d.tamano],
    ['Registros demo', String(d.pacientes)],
    ['Inferencias demo', String(d.inferencias)],
    ['Rango TI-RADS de ejemplo', d.tiRads],
    ['Rango Bethesda de ejemplo', d.bethesda],
    ['Fecha de la muestra', d.fecha],
  ];
}

export function Datasets({
  datasets,
  requests,
  onRequestPreview,
  onRequestAccess,
  onDownloadSample,
}: {
  datasets: DemoDataset[];
  requests: DemoDatasetRequest[];
  onRequestPreview: (id: string) => void;
  /** Callback visual con el motivo escrito; no crea ni guarda ninguna solicitud. */
  onRequestAccess: (datasetId: string, reason: string) => void;
  /** Callback visual para solicitudes aprobadas; no genera ni descarga archivos. */
  onDownloadSample: (requestId: string) => void;
}) {
  const formId = useId();
  const [selected, setSelected] = useState<DemoDataset | null>(null);
  const [datasetId, setDatasetId] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const activeDatasetId = datasets.some((d) => d.id === datasetId) ? datasetId : datasets[0]?.id;
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Datasets sintéticos"
        description="Colecciones ficticias para explorar estructuras de datos."
      >
        <ResearcherLayout
          title="Colecciones disponibles"
          description="Los registros son demostrativos y no contienen información real."
        >
          <Callout tone="info" title="Desidentificación">
            Todos los datos están desidentificados; no se incluyen nombres ni identificadores
            personales.
          </Callout>
          <div className="overflow-x-auto">
            <Table caption="Datasets sintéticos disponibles">
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Filas</TableHead>
                  <TableHead>Estado de acceso</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nombre}</TableCell>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>{d.pacientes}</TableCell>
                    <TableCell>
                      <StatusBadge kind="dataset-request" status="pendiente" />
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onRequestAccess(d.id, '')}>
                        Solicitar acceso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3">
            {datasets.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-semibold">{d.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{d.descripcion}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {d.pacientes} registros demo · {d.formato} · {d.tamano}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">Sintético</Badge>
                    <Button
                      variant="outline"
                      aria-label={`Vista previa de ${d.nombre}`}
                      onClick={() => {
                        setSelected(d);
                        onRequestPreview(d.id);
                      }}
                    >
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <section aria-labelledby={`${formId}-title`} className="space-y-3">
            <h3 id={`${formId}-title`} className="text-lg font-semibold">
              Solicitar acceso a una colección
            </h3>
            {activeDatasetId ? (
              <form
                className="max-w-xl space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  onRequestAccess(activeDatasetId, reason.trim());
                  setReason('');
                  setNotice(
                    'La acción de demostración se activó; la lista de solicitudes no cambia ni se guardó ningún dato.',
                  );
                }}
              >
                <Field label="Colección">
                  <Select value={activeDatasetId} onChange={(e) => setDatasetId(e.target.value)}>
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Motivo de la solicitud"
                  hint="El motivo solo se usa en esta vista; no se guarda ni se envía a ningún servicio."
                  required
                >
                  <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                      e.target.setCustomValidity(
                        e.target.value.trim() ? '' : 'Escribe un motivo que no sea solo espacios.',
                      );
                      setReason(e.target.value);
                    }}
                  />
                </Field>
                <Button type="submit">Solicitar acceso</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay colecciones sintéticas para solicitar.
              </p>
            )}
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          </section>
          <section aria-labelledby={`${formId}-requests`} className="space-y-3">
            <h3 id={`${formId}-requests`} className="text-lg font-semibold">
              Solicitudes de demostración
            </h3>
            {requests.length ? (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-card border p-3 text-sm"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{r.datasetNombre}</p>
                      <p className="text-muted-foreground">{r.motivo}</p>
                      <p className="text-muted-foreground">
                        {REQUEST_HINTS[r.estado]}
                        {r.revisadoPor ? ` Revisó: ${r.revisadoPor}.` : ''}
                      </p>
                      {r.observacion ? (
                        <p className="text-muted-foreground">Observación: {r.observacion}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge kind="dataset-request" status={r.estado} />
                      {r.estado === 'aprobado' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Descargar muestra de ${r.datasetNombre}`}
                          onClick={() => {
                            onDownloadSample(r.id);
                            setNotice(
                              'Descarga de demostración: no se generó ni se descargó ningún archivo.',
                            );
                          }}
                        >
                          Descargar muestra
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay solicitudes sintéticas.</p>
            )}
          </section>
          {selected && (
            <Dialog
              open
              onOpenChange={(open) => !open && setSelected(null)}
              size="lg"
              title={selected.nombre}
              description="Vista previa sintética: estructura de ejemplo, sin archivos ni casos reales."
              footer={
                <DialogClose asChild>
                  <Button>Cerrar</Button>
                </DialogClose>
              }
            >
              <div className="space-y-5">
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {previewRows(selected).map(([term, value]) => (
                    <div key={term}>
                      <dt className="text-muted-foreground">{term}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Archivos de ejemplo</h3>
                  <ul className="list-inside list-disc text-sm">
                    {selected.partes.map((parte) => (
                      <li key={parte}>{parte}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">{selected.descripcion}</p>
              </div>
            </Dialog>
          )}
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
