import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../design-system/components/atoms/Button';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { listarPacientes, type Paciente } from '../../api/pacientes';
import { FiltrosHistorial } from './historial/FiltrosHistorial';
import { TablaHistorial } from './historial/TablaHistorial';
import { LIMITE_POR_PAGINA } from './historial/compartidos';
import { useHistorial } from './historial/useHistorial';

interface HistorialInferenciasPageProps {
  /** Fuerza el historial de un caso; si se omite, se toma `casoId` de la ruta. */
  casoId?: string;
}

/**
 * Historial real de inferencias (HU-072).
 *
 * Sin caso en la ruta consulta `GET /resultados` con filtros y paginación del
 * servidor; con `casoId` consulta `GET /casos/{id}/inferencias` y pagina en
 * memoria, porque ese endpoint no acepta paginación.
 */
export function HistorialInferenciasPage({ casoId: casoIdProp }: HistorialInferenciasPageProps) {
  const { casoId: casoIdRuta } = useParams<{ casoId?: string }>();
  const casoId = casoIdProp ?? (casoIdRuta === '' ? undefined : casoIdRuta);
  const enCaso = Boolean(casoId);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [paciente, setPaciente] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [clase, setClase] = useState('');
  const [desplazamiento, setDesplazamiento] = useState(0);

  useEffect(() => {
    if (enCaso) return;
    let vigente = true;
    void listarPacientes({ limite: 50 })
      .then((resultado) => {
        if (vigente && resultado.ok) setPacientes(resultado.data.items);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [enCaso]);

  const { filas, total, cargando, error, recargar } = useHistorial({
    ...(casoId ? { casoId } : {}),
    paciente,
    desde,
    hasta,
    clase,
    desplazamiento,
  });

  function cambiarFiltro(actualizar: () => void) {
    actualizar();
    setDesplazamiento(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial de inferencias"
        description={
          enCaso
            ? 'Inferencias del caso, de la más reciente a la más antigua.'
            : 'Inferencias registradas en la institución; filtra por paciente, fecha o clase.'
        }
        actions={
          enCaso ? (
            <Button asChild variant="secondary">
              <Link to={`/medico/casos/${casoId}`}>Volver al caso</Link>
            </Button>
          ) : undefined
        }
      />

      {enCaso ? null : (
        <FiltrosHistorial
          pacientes={pacientes}
          paciente={paciente}
          desde={desde}
          hasta={hasta}
          clase={clase}
          onPaciente={(valor) => cambiarFiltro(() => setPaciente(valor))}
          onDesde={(valor) => cambiarFiltro(() => setDesde(valor))}
          onHasta={(valor) => cambiarFiltro(() => setHasta(valor))}
          onClase={(valor) => cambiarFiltro(() => setClase(valor))}
        />
      )}

      {error ? (
        <Callout tone="danger" title="No se pudieron cargar las inferencias">
          <div className="flex flex-col items-start gap-3">
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={() => void recargar()}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}

      {cargando ? (
        <Spinner size="lg" label="Cargando historial de inferencias" />
      ) : filas.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin inferencias"
          description={
            enCaso
              ? 'Este caso aún no tiene inferencias. Analiza una ecografía para generar la primera.'
              : 'Ajusta los filtros o analiza una ecografía para generar inferencias.'
          }
        />
      ) : (
        <TablaHistorial filas={filas} modo={enCaso ? 'caso' : 'institucional'} />
      )}

      {!cargando && error === null && total > 0 ? (
        <Pagination
          total={total}
          limit={LIMITE_POR_PAGINA}
          offset={desplazamiento}
          onOffsetChange={setDesplazamiento}
          itemLabel="inferencia"
        />
      ) : null}
    </div>
  );
}
