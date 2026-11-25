import { useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { DetalleDataset } from './datasets/DetalleDataset';
import { ListaDatasets } from './datasets/ListaDatasets';
import { useDatasets } from './datasets/useDatasets';
import { useDetalleDataset } from './datasets/useDetalleDataset';

/** Consulta de datasets anonimizados construidos con casos consentidos (HU-090). */
export function DatasetsPage() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const lista = useDatasets();
  const detalle = useDetalleDataset(seleccionado);

  const etiquetaTotal = lista.total === 1 ? '1 conjunto' : `${lista.total} conjuntos`;

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Datasets anonimizados"
        description="Conjuntos construidos solo con casos que aceptaron investigación. Sin identificadores de pacientes."
      />

      <Callout tone="info" title="Datos desidentificados">
        Cada fila usa un sujeto seudónimo y rangos o meses en lugar de fechas exactas. Los conjuntos
        se publican con al menos k casos y no incluyen vínculos con el caso original.
      </Callout>

      {lista.error ? (
        <Callout tone="danger" role="alert">
          {lista.error}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={lista.recargar}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}

      {lista.cargando ? <Spinner size="lg" label="Cargando datasets" /> : null}

      {!lista.cargando && !lista.error && lista.items.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin datasets"
          description="Todavía no hay conjuntos anonimizados. Aparecerán aquí cuando se construyan a partir de casos con consentimiento de investigación."
        />
      ) : null}

      {!lista.cargando && !lista.error && lista.items.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{etiquetaTotal} · más reciente primero</p>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <ListaDatasets
                datasets={lista.items}
                seleccionado={seleccionado}
                onSeleccionar={setSeleccionado}
              />
            </div>
            <div className="lg:col-span-3">
              <DetalleDataset
                id={seleccionado}
                dataset={detalle.dataset}
                cargando={detalle.cargando}
                error={detalle.error}
                onReintentar={detalle.recargar}
              />
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Las consultas se registran en la bitácora. Si un dataset deja de estar disponible, el
        servidor responde sin exponer datos de otra institución.
      </p>
    </section>
  );
}
