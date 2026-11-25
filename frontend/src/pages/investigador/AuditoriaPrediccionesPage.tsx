import { useCallback, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { FILTROS_VACIOS, type FiltrosPredicciones as Filtros } from './predicciones/compartidos';
import { FiltrosPredicciones } from './predicciones/FiltrosPredicciones';
import { TablaPredicciones } from './predicciones/TablaPredicciones';
import { usePredicciones } from './predicciones/usePredicciones';

const LIMITE_POR_PAGINA = 25;

/** Auditoría individual de predicciones con la referencia clínica y su diferencia. */
export function AuditoriaPrediccionesPage() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [desplazamiento, setDesplazamiento] = useState(0);

  const rangoInvalido = Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta);
  const { items, total, cargando, error, recargar } = usePredicciones(
    filtros,
    LIMITE_POR_PAGINA,
    desplazamiento,
    rangoInvalido,
  );

  const cambiarFiltros = useCallback((siguientes: Filtros) => {
    setFiltros(siguientes);
    setDesplazamiento(0);
  }, []);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Predicciones auditadas"
        description="Caso por caso: predicción del modelo, referencia clínica y diferencia. Horas en UTC."
      />

      <FiltrosPredicciones
        filtros={filtros}
        rangoInvalido={rangoInvalido}
        onCambio={cambiarFiltros}
      />

      {rangoInvalido ? (
        <Callout tone="warning" role="alert">
          La fecha inicial no puede ser posterior a la final.
        </Callout>
      ) : null}

      {error ? (
        <Callout tone="danger" title="No se pudieron cargar las predicciones">
          {error}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}

      {cargando ? (
        <Spinner size="lg" label="Cargando predicciones auditadas" />
      ) : !rangoInvalido && items.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin predicciones"
          description="Ajusta los filtros para consultar otro período, resultado o caso."
        />
      ) : !rangoInvalido ? (
        <>
          <p className="text-sm text-muted-foreground">Más reciente primero · Horas en UTC</p>
          <TablaPredicciones predicciones={items} />
        </>
      ) : null}

      {!rangoInvalido ? (
        <Pagination
          total={total}
          limit={LIMITE_POR_PAGINA}
          offset={desplazamiento}
          onOffsetChange={setDesplazamiento}
          itemLabel="predicción"
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        La predicción es inmutable; la referencia clínica es la decisión médica registrada y nunca
        modifica el resultado del modelo. Cada consulta queda registrada en la bitácora.
      </p>
    </section>
  );
}
