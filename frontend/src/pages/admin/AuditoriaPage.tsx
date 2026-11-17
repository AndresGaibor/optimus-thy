import { useCallback, useEffect, useState } from 'react';
import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { RECURSOS_AUDITORIA, listarBitacora, type EventoAuditoria } from '../../api/auditoria';
import { listarUsuarios, type Usuario } from '../../api/usuarios';

const LIMITE_POR_PAGINA = 50;
const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'medium' });

export function AuditoriaPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState('');
  const [accion, setAccion] = useState('');
  const [recurso, setRecurso] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listarUsuarios({ limite: 50 }).then((resultado) => {
      if (resultado.ok) setUsuarios(resultado.data.items);
    });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await listarBitacora({
        ...(usuario ? { usuario } : {}),
        ...(accion ? { accion } : {}),
        ...(recurso ? { recurso } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
        limite: LIMITE_POR_PAGINA,
        desplazamiento,
      });
      setEventos(datos.items);
      setTotal(datos.total);
    } catch {
      setError('No se pudo cargar la bitácora. Reintenta la operación.');
      setEventos([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, [usuario, accion, recurso, desde, hasta, desplazamiento]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function cambiarFiltro(actualizar: () => void) {
    actualizar();
    setDesplazamiento(0);
  }

  const correos = new Map(usuarios.map((fila) => [fila.id, fila.correo]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auditoría"
        description="Bitácora de solo lectura: eventos de la institución, del más reciente al más antiguo."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-usuario">Usuario</Label>
          <Select
            id="bitacora-usuario"
            value={usuario}
            onChange={(evento) => cambiarFiltro(() => setUsuario(evento.target.value))}
          >
            <option value="">Todos</option>
            {usuarios.map((fila) => (
              <option key={fila.id} value={fila.id}>
                {fila.correo}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-accion">Acción</Label>
          <Input
            id="bitacora-accion"
            placeholder="AUTH, PATIENTS, …"
            value={accion}
            onChange={(evento) => cambiarFiltro(() => setAccion(evento.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-recurso">Recurso</Label>
          <Select
            id="bitacora-recurso"
            value={recurso}
            onChange={(evento) => cambiarFiltro(() => setRecurso(evento.target.value))}
          >
            <option value="">Todos</option>
            {RECURSOS_AUDITORIA.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-desde">Desde</Label>
          <Input
            id="bitacora-desde"
            type="date"
            value={desde}
            onChange={(evento) => cambiarFiltro(() => setDesde(evento.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bitacora-hasta">Hasta</Label>
          <Input
            id="bitacora-hasta"
            type="date"
            value={hasta}
            onChange={(evento) => cambiarFiltro(() => setHasta(evento.target.value))}
          />
        </div>
      </div>

      {error ? (
        <Callout tone="danger" title="No se pudo cargar la bitácora">
          {error}
        </Callout>
      ) : null}

      {cargando ? (
        <Spinner size="lg" label="Cargando bitácora" />
      ) : eventos.length === 0 ? (
        <EmptyState
          title="Sin eventos"
          description="Ajusta los filtros para consultar otro período o usuario."
        />
      ) : (
        <Table caption="Eventos de auditoría">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.map((evento) => (
              <TableRow key={evento.id}>
                <TableCell>{FORMATO_FECHA.format(new Date(evento.ocurrido_en))}</TableCell>
                <TableCell>
                  {evento.usuario_id ? (correos.get(evento.usuario_id) ?? evento.usuario_id) : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">{evento.accion}</TableCell>
                <TableCell>
                  {evento.entidad}
                  {evento.entidad_id ? ` · ${evento.entidad_id.slice(0, 8)}` : ''}
                </TableCell>
                <TableCell>{evento.direccion_ip ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {evento.detalles
                    ? Object.entries(evento.detalles)
                        .map(([clave, valor]) => `${clave}=${String(valor)}`)
                        .join(' · ')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination
        total={total}
        limit={LIMITE_POR_PAGINA}
        offset={desplazamiento}
        onOffsetChange={setDesplazamiento}
        itemLabel="evento"
      />
      <p className="text-xs text-muted-foreground">
        La bitácora no se edita ni se borra desde la aplicación; cada consulta queda registrada.
      </p>
    </div>
  );
}
