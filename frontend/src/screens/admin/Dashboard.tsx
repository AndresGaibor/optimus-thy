import { useId, useState } from 'react';
import { Activity, Shield, Users } from 'lucide-react';
import {
  ActivityTypeBadge,
  Button,
  Dialog,
  Field,
  StatCard,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../../design-system';
import type { DemoAuditEvent, DemoDatasetRequest, DemoSystemSummary } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout, SectionCard } from '../researcher/ResearcherBlocks';

export function Dashboard({
  events,
  requests,
  summary,
  onApproveRequest,
  onRejectRequest,
}: {
  events: DemoAuditEvent[];
  requests: DemoDatasetRequest[];
  summary: DemoSystemSummary;
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string, reason: string) => void;
}) {
  const formId = useId();
  const [notice, setNotice] = useState('');
  const [rejecting, setRejecting] = useState<DemoDatasetRequest | null>(null);
  const [reason, setReason] = useState('');
  const closeRejection = () => {
    setRejecting(null);
    setReason('');
  };
  const pendingRequests = requests.filter((r) => r.estado === 'pendiente');
  return (
    <DemoRoleLayout role="administrador">
      <ScreenFrame
        title="Dashboard — Administrador"
        description="Resumen sintético de actividad y configuración."
      >
        <ResearcherLayout
          title="Estado general"
          description="Los valores representan únicamente esta demostración."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Usuarios activos"
              value={summary.usuarios}
              icon={Users}
              tone="warning"
            />
            <StatCard label="Roles" value={3} icon={Shield} tone="info" />
            <StatCard
              label="Solicitudes pendientes"
              value={pendingRequests.length}
              icon={Activity}
              tone="warning"
            />
            <StatCard
              label="Eventos de auditoría"
              value={events.length}
              icon={Activity}
              tone="neutral"
            />
          </div>
          <SectionCard title="Actividad reciente">
            {events.length ? (
              <div className="overflow-x-auto">
                <Table caption="Actividad reciente del sistema">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca temporal</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.fecha}</TableCell>
                        <TableCell>{e.usuario}</TableCell>
                        <TableCell>{e.accion}</TableCell>
                        <TableCell>{e.detalle}</TableCell>
                        <TableCell className="flex gap-2">
                          <ActivityTypeBadge type={e.tipo} />
                          <StatusBadge kind="user" status="Activo" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground">Sin actividad reciente.</p>
            )}
          </SectionCard>
          <SectionCard title="Solicitudes de acceso">
            {requests.length ? (
              <ul className="divide-y">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium">
                        {r.datasetNombre} · {r.solicitanteNombre}
                      </p>
                      <p className="text-sm text-muted-foreground">{r.motivo}</p>
                      {r.observacion ? (
                        <p className="text-sm text-muted-foreground">{r.observacion}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge kind="dataset-request" status={r.estado} />
                      {r.estado === 'pendiente' ? (
                        <>
                          <Button
                            size="sm"
                            aria-label={`Aprobar solicitud de ${r.datasetNombre}`}
                            onClick={() => {
                              onApproveRequest(r.id);
                              setNotice(
                                'La acción de demostración se activó; el estado no cambia ni se guardó ninguna decisión.',
                              );
                            }}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Rechazar solicitud de ${r.datasetNombre}`}
                            onClick={() => setRejecting(r)}
                          >
                            Rechazar
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay solicitudes sintéticas.</p>
            )}
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              {notice}
            </p>
          </SectionCard>
          {rejecting && (
            <Dialog
              open
              onOpenChange={(next) => {
                if (!next) closeRejection();
              }}
              title="Rechazar solicitud de demostración"
              description={`Indica el motivo para ${rejecting.datasetNombre}. Solo se usa en esta vista y no se guarda ni se envía a ningún servicio.`}
              footer={
                <>
                  <Button type="button" variant="outline" onClick={closeRejection}>
                    Cancelar
                  </Button>
                  <Button type="submit" form={formId} variant="destructive">
                    Rechazar solicitud
                  </Button>
                </>
              }
            >
              <form
                id={formId}
                onSubmit={(e) => {
                  e.preventDefault();
                  onRejectRequest(rejecting.id, reason.trim());
                  setNotice(
                    'La acción de demostración se activó; el estado no cambia ni se guardó ninguna decisión.',
                  );
                  closeRejection();
                }}
              >
                <Field label="Motivo del rechazo" required>
                  <Textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => {
                      e.target.setCustomValidity(
                        e.target.value.trim() ? '' : 'Escribe un motivo que no sea solo espacios.',
                      );
                      setReason(e.target.value);
                    }}
                  />
                </Field>
              </form>
            </Dialog>
          )}
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
