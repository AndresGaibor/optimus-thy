import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { Dialog } from '../../design-system/components/organisms/Dialog';
import { listarBitacora, type EventoAuditoria } from '../../api/auditoria';
import { listarUsuarios, type Usuario } from '../../api/usuarios';
import { AuditoriaFiltros, FILTROS_VACIOS, type FiltrosAuditoria } from './AuditoriaFiltros';
import { AuditoriaTabla, FORMATO_FECHA } from './AuditoriaTabla';
import { etiquetaEvento, nombreCampo } from './etiquetas-evento';

const LIMITE_POR_PAGINA = 50;

export function AuditoriaPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(FILTROS_VACIOS);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [detalle, setDetalle] = useState<EventoAuditoria | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rangoInvalido = Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta);

  useEffect(() => {
    void listarUsuarios({ limite: 50 }).then((resultado) => {
      if (resultado.ok) setUsuarios(resultado.data.items);
    });
  }, []);

  const cargar = useCallback(async () => {
    if (rangoInvalido) {
      setEventos([]);
      setTotal(0);
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const datos = await listarBitacora({
        ...(filtros.usuario ? { usuario: filtros.usuario } : {}),
        ...(filtros.accion ? { accion: filtros.accion } : {}),
        ...(filtros.recurso ? { recurso: filtros.recurso } : {}),
        ...(filtros.desde ? { desde: filtros.desde } : {}),
        ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
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
  }, [filtros, desplazamiento, rangoInvalido]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiarFiltros = useCallback((siguientes: FiltrosAuditoria) => {
    setFiltros(siguientes);
    setDesplazamiento(0);
    setDetalle(null);
  }, []);

  const correos = new Map(usuarios.map((fila) => [fila.id, fila.correo]));

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Auditoría"
        description="Bitácora de solo lectura: eventos de la institución, del más reciente al más antiguo."
      />

      <AuditoriaFiltros
        filtros={filtros}
        usuarios={usuarios}
        rangoInvalido={rangoInvalido}
        onCambio={cambiarFiltros}
      />

      {rangoInvalido ? (
        <Callout tone="warning" role="alert">
          La fecha inicial no puede ser posterior a la final.
        </Callout>
      ) : null}

      {error ? (
        <Callout tone="danger" title="No se pudo cargar la bitácora">
          {error}
        </Callout>
      ) : null}

      {cargando ? (
        <Spinner size="lg" label="Cargando bitácora" />
      ) : !rangoInvalido && eventos.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin eventos"
          description="Ajusta los filtros para consultar otro período o usuario."
        />
      ) : !rangoInvalido ? (
        <>
          <p className="text-sm text-muted-foreground">Más reciente primero · Horas en UTC</p>
          <AuditoriaTabla eventos={eventos} correos={correos} onVerDetalle={setDetalle} />
        </>
      ) : null}

      {!rangoInvalido ? (
        <Pagination
          total={total}
          limit={LIMITE_POR_PAGINA}
          offset={desplazamiento}
          onOffsetChange={setDesplazamiento}
          itemLabel="evento"
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        La bitácora no se edita ni se borra desde la aplicación; cada consulta queda registrada.
      </p>

      <Dialog
        open={detalle !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setDetalle(null);
        }}
        side="right"
        title="Detalle del evento"
        {...(detalle ? { description: etiquetaEvento(detalle.accion).titulo } : {})}
      >
        {detalle ? <DetalleEvento evento={detalle} correos={correos} /> : null}
      </Dialog>
    </section>
  );
}

interface DetalleEventoProps {
  evento: EventoAuditoria;
  correos: Map<string, string>;
}

function DetalleEvento({ evento, correos }: DetalleEventoProps) {
  const etiqueta = etiquetaEvento(evento.accion);
  const usuario = evento.usuario_id ? (correos.get(evento.usuario_id) ?? evento.usuario_id) : '—';
  const campos: [string, string][] = [
    ['Fecha y hora (UTC)', FORMATO_FECHA.format(new Date(evento.ocurrido_en))],
    ['Usuario', usuario],
    ['Código', etiqueta.codigo],
    ['Módulo', etiqueta.modulo ?? '—'],
    ['Recurso', `${evento.entidad}${evento.entidad_id ? ` · ${evento.entidad_id}` : ''}`],
    ['Origen registrado', evento.direccion_ip ?? '—'],
    ...Object.entries(evento.detalles ?? {}).map(
      ([clave, valor]) => [nombreCampo(clave), String(valor)] as [string, string],
    ),
  ];

  return (
    <dl className="divide-y divide-border text-sm">
      {campos.map(([nombre, valor], indice) => (
        <div key={indice} className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-3">
          <dt className="text-muted-foreground sm:w-40 sm:shrink-0">{nombre}</dt>
          <dd className="break-all text-foreground">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
