import { useState, type FormEvent } from 'react';
import {
  type EstadoSolicitud,
  type SolicitudDerecho,
  cerrarSolicitud,
} from '../../../api/solicitudes-derechos';
import { Badge } from '../../../design-system/components/atoms/Badge';
import { Button } from '../../../design-system/components/atoms/Button';
import { Input } from '../../../design-system/components/atoms/Input';
import { Select } from '../../../design-system/components/atoms/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../design-system/components/atoms/Table';
import { Callout } from '../../../design-system/components/molecules/Callout';
import { Field } from '../../../design-system/components/molecules/Field';
import { Dialog } from '../../../design-system/components/organisms/Dialog';

const FECHA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeZone: 'UTC' });
const ETIQUETA_TIPO: Record<SolicitudDerecho['tipo'], string> = {
  acceso: 'Acceso',
  rectificacion: 'Rectificación',
  cancelacion: 'Cancelación',
  oposicion: 'Oposición',
};
const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  atendida: 'Atendida',
  rechazada: 'Rechazada',
};

interface TablaSolicitudesProps {
  items: SolicitudDerecho[];
  onCerrada: () => void;
}

function formatearFecha(fecha: string): string {
  return FECHA.format(new Date(`${fecha}T00:00:00Z`));
}

export function TablaSolicitudes({ items, onCerrada }: TablaSolicitudesProps) {
  const [seleccionada, setSeleccionada] = useState<SolicitudDerecho | null>(null);
  const [estadoFinal, setEstadoFinal] = useState<'atendida' | 'rechazada'>('atendida');
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cambiarDialogo(abierto: boolean) {
    if (!abierto) {
      setSeleccionada(null);
      setError(null);
      setRespuesta('');
    }
  }

  async function guardarCierre(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionada) return;
    const texto = respuesta.trim();
    if (texto.length < 10 || texto.length > 2000) {
      setError('La respuesta debe tener entre 10 y 2000 caracteres.');
      return;
    }
    setError(null);
    setGuardando(true);
    const resultado = await cerrarSolicitud(seleccionada.id, {
      estado: estadoFinal,
      respuesta: texto,
    });
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    cambiarDialogo(false);
    onCerrada();
  }

  return (
    <section className="space-y-4" aria-label="Listado de solicitudes de derechos">
      <div className="overflow-x-auto">
        <Table caption="Solicitudes de derechos de titulares">
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Solicitada</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead>Días restantes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((solicitud) => {
              const tono = solicitud.vencida
                ? 'warning'
                : solicitud.estado === 'rechazada'
                  ? 'danger'
                  : solicitud.estado === 'atendida'
                    ? 'success'
                    : 'neutral';
              return (
                <TableRow key={solicitud.id}>
                  <TableCell>{ETIQUETA_TIPO[solicitud.tipo]}</TableCell>
                  <TableCell className="font-mono">{solicitud.referencia_titular}</TableCell>
                  <TableCell>{formatearFecha(solicitud.solicitada_en)}</TableCell>
                  <TableCell>{formatearFecha(solicitud.fecha_limite)}</TableCell>
                  <TableCell>
                    {solicitud.dias_restantes} {solicitud.dias_restantes === 1 ? 'día' : 'días'}
                  </TableCell>
                  <TableCell>
                    <Badge tone={tono}>{ETIQUETA_ESTADO[solicitud.estado]}</Badge>
                    {solicitud.vencida ? <span className="sr-only">; vencida</span> : null}
                  </TableCell>
                  <TableCell>
                    {solicitud.estado === 'pendiente' ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSeleccionada(solicitud);
                          setEstadoFinal('atendida');
                          setRespuesta('');
                        }}
                      >
                        Cerrar
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog
        open={seleccionada !== null}
        onOpenChange={cambiarDialogo}
        title="Cerrar solicitud"
        description={
          seleccionada
            ? `Indica el resultado de la solicitud ${seleccionada.referencia_titular}.`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => cambiarDialogo(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="formulario-cierre" loading={guardando}>
              Guardar cierre
            </Button>
          </div>
        }
      >
        <form id="formulario-cierre" className="space-y-4" onSubmit={guardarCierre}>
          <Field label="Estado final" required>
            <Select
              value={estadoFinal}
              onChange={(evento) => setEstadoFinal(evento.target.value as 'atendida' | 'rechazada')}
            >
              <option value="atendida">Atendida</option>
              <option value="rechazada">Rechazada</option>
            </Select>
          </Field>
          <Field label="Respuesta" required hint="Entre 10 y 2000 caracteres.">
            <Input
              autoComplete="off"
              value={respuesta}
              maxLength={2000}
              onChange={(evento) => setRespuesta(evento.target.value)}
            />
          </Field>
          {error ? (
            <Callout tone="danger" role="alert">
              {error}
            </Callout>
          ) : null}
        </form>
      </Dialog>
    </section>
  );
}
