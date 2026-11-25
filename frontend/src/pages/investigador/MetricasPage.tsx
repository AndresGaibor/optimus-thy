import { useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Card, CardContent, CardHeader } from '../../design-system/components/atoms/Card';
import { Skeleton } from '../../design-system/components/atoms/Skeleton';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { FiltrosMetricas } from './metricas/FiltrosMetricas';
import { FILTROS_METRICAS_VACIOS, type FiltrosMetricas as Filtros } from './metricas/compartidos';
import { TablaMetricas } from './metricas/TablaMetricas';
import { useMetricas } from './metricas/useMetricas';

function EsqueletoMetricas() {
  return (
    <section aria-busy="true" className="space-y-4">
      <span role="status" aria-label="Cargando métricas" className="sr-only">
        Cargando métricas
      </span>
      <div aria-hidden="true" className="space-y-4">
        {[0, 1].map((fila) => (
          <Card key={fila}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** Acuerdo del modelo con la decisión médica registrada, sin inferir validez clínica. */
export function MetricasPage() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_METRICAS_VACIOS);
  const rangoInvalido = Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta);
  const metricas = useMetricas(filtros, rangoInvalido);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Métricas de acuerdo"
        description="Resumen de las decisiones médicas registradas para cada modelo; fechas en UTC."
      />

      <Callout tone="info" title="Alcance de la métrica">
        El acuerdo refleja acepta / total, incluida la revisión pendiente. No representa
        sensibilidad, especificidad ni una validación clínica.
      </Callout>

      <FiltrosMetricas
        filtros={filtros}
        modelos={metricas.modelos}
        rangoInvalido={rangoInvalido}
        onCambio={setFiltros}
      />

      {rangoInvalido ? (
        <Callout tone="warning" role="alert">
          La fecha inicial no puede ser posterior a la final.
        </Callout>
      ) : null}

      {!rangoInvalido && metricas.error ? (
        <Callout tone="danger" role="alert" title="No se pudieron cargar las métricas">
          {metricas.error}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={metricas.recargar}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}

      {metricas.cargando ? (
        <EsqueletoMetricas />
      ) : !rangoInvalido && !metricas.error && metricas.items.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin métricas disponibles"
          description="No hay modelos ni inferencias para los filtros seleccionados."
        />
      ) : !rangoInvalido && !metricas.error ? (
        <div className="space-y-4">
          {metricas.items.map((fila) => (
            <TablaMetricas key={fila.modelo.id} metricas={fila} />
          ))}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Los resultados agregados se restringen a la institución del investigador y cada consulta se
        registra en la bitácora.
      </p>
    </section>
  );
}
