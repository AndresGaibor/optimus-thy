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
import { etiquetaEvento } from './etiquetas-evento';

export const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
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
  onVerDetalle: (evento: EventoAuditoria) => void;
}

/**
 * Bitácora de solo lectura en una línea por evento; el detalle técnico se
 * inspecciona en el panel lateral, no dentro de la fila.
 */
export function AuditoriaTabla({ eventos, correos, onVerDetalle }: AuditoriaTablaProps) {
  return (
    <Table caption="Eventos de auditoría">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Fecha y hora (UTC)</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Evento</TableHead>
          <TableHead>Recurso</TableHead>
          <TableHead className="whitespace-nowrap">Origen</TableHead>
          <TableHead className="w-px">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {eventos.map((evento) => {
          const etiqueta = etiquetaEvento(evento.accion);
          const fecha = FORMATO_FECHA.format(new Date(evento.ocurrido_en));
          const usuario = evento.usuario_id
            ? (correos.get(evento.usuario_id) ?? evento.usuario_id)
            : '—';
          return (
            <TableRow key={evento.id}>
              <TableCell className="whitespace-nowrap tabular-nums">{fecha}</TableCell>
              <TableCell className="max-w-64 truncate">{usuario}</TableCell>
              <TableCell className="max-w-64 truncate font-medium text-foreground">
                {etiqueta.titulo}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {evento.entidad}
                {evento.entidad_id ? ` · ${evento.entidad_id.slice(0, 8)}` : ''}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {evento.direccion_ip ?? '—'}
              </TableCell>
              <TableCell className="w-px whitespace-nowrap text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Ver detalle de «${etiqueta.titulo}» del ${fecha}`}
                  onClick={() => onVerDetalle(evento)}
                >
                  Ver detalle
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
