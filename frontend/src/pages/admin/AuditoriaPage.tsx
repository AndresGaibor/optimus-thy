import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { listarBitacora, type EventoAuditoria } from '../../api/auditoria';
import { listarUsuarios, type Usuario } from '../../api/usuarios';
import { AuditoriaFiltros, FILTROS_VACIOS, type FiltrosAuditoria } from './AuditoriaFiltros';
import { AuditoriaTabla } from './AuditoriaTabla';

const LIMITE_POR_PAGINA = 50;

export function AuditoriaPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(FILTROS_VACIOS);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [expandido, setExpandido] = useState<number | null>(null);
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
    setExpandido(null);
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
        <AuditoriaTabla
          eventos={eventos}
          correos={correos}
          expandido={expandido}
          onExpandir={(id) => setExpandido((actual) => (actual === id ? null : id))}
        />
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
    </section>
  );
}
