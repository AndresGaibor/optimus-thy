import { Button } from '../../design-system/components/atoms/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import type { EventoAuditoria } from '../../api/auditoria';
import { etiquetaEvento, resumenDetalles, type EtiquetaEvento } from './etiquetas-evento';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export interface AuditoriaTablaProps {
  eventos: EventoAuditoria[];
  correos: Map<string, string>;
  expandido: number | null;
  onExpandir: (id: number) => void;
}

/** Bitácora de solo lectura, compacta, con el detalle técnico plegado por fila. */
export function AuditoriaTabla({ eventos, correos, expandido, onExpandir }: AuditoriaTablaProps) {
  return (
    <Table caption="Eventos de auditoría">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Fecha y hora (UTC)</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Evento</TableHead>
          <TableHead>Recurso</TableHead>
          <TableHead className="whitespace-nowrap">Origen</TableHead>
          <TableHead>Detalles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {eventos.map((evento) => {
          const etiqueta = etiquetaEvento(evento.accion);
          const abierto = expandido === evento.id;
          const detalleId = `detalle-evento-${evento.id}`;
          return (
            <FragmentFila
              key={evento.id}
              evento={evento}
              correos={correos}
              etiqueta={etiqueta}
              abierto={abierto}
              detalleId={detalleId}
              onExpandir={onExpandir}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}

interface FilaProps {
  evento: EventoAuditoria;
  correos: Map<string, string>;
  etiqueta: EtiquetaEvento;
  abierto: boolean;
  detalleId: string;
  onExpandir: (id: number) => void;
}

function FragmentFila({ evento, correos, etiqueta, abierto, detalleId, onExpandir }: FilaProps) {
  const resumen = resumenDetalles(evento.detalles);
  return (
    <>
      <TableRow>
        <TableCell className="whitespace-nowrap py-3 tabular-nums">
          {FORMATO_FECHA.format(new Date(evento.ocurrido_en))}
        </TableCell>
        <TableCell className="py-3">
          {evento.usuario_id ? (correos.get(evento.usuario_id) ?? evento.usuario_id) : '—'}
        </TableCell>
        <TableCell className="py-3">
          <span className="block font-medium text-foreground">{etiqueta.titulo}</span>
          <span className="font-mono text-xs text-muted-foreground">{etiqueta.codigo}</span>
        </TableCell>
        <TableCell className="py-3">
          {evento.entidad}
          {evento.entidad_id ? ` · ${evento.entidad_id.slice(0, 8)}` : ''}
        </TableCell>
        <TableCell className="whitespace-nowrap py-3 tabular-nums">
          {evento.direccion_ip ?? '—'}
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{resumen ?? 'Sin detalles'}</span>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={abierto}
              aria-controls={detalleId}
              onClick={() => onExpandir(evento.id)}
            >
              {abierto ? 'Ocultar' : 'Ver detalle'}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {abierto ? (
        <TableRow>
          <TableCell colSpan={6} className="bg-border-subtle/40 py-3">
            <dl id={detalleId} className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Evento</dt>
                <dd className="font-mono">{etiqueta.codigo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Módulo</dt>
                <dd>{etiqueta.modulo ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Recurso</dt>
                <dd>
                  {evento.entidad}
                  {evento.entidad_id ? ` · ${evento.entidad_id}` : ''}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Origen registrado</dt>
                <dd className="tabular-nums">{evento.direccion_ip ?? '—'}</dd>
              </div>
              {Object.entries(evento.detalles ?? {}).map(([clave, valor]) => (
                <div key={clave} className="flex gap-2">
                  <dt className="text-muted-foreground">{clave}</dt>
                  <dd className="break-all">{String(valor)}</dd>
                </div>
              ))}
            </dl>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
