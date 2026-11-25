import type { DatasetResumen } from '../../../api/datasets';
import { Badge } from '../../../design-system/components/atoms/Badge';
import { Button } from '../../../design-system/components/atoms/Button';
import { Card, CardContent, CardTitle } from '../../../design-system/components/atoms/Card';
import { FORMATO_FECHA, huellaCorta } from './compartidos';

export interface ListaDatasetsProps {
  datasets: DatasetResumen[];
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
}

/** Tarjetas con los metadatos de cada conjunto; el detalle se abre al elegir una. */
export function ListaDatasets({ datasets, seleccionado, onSeleccionar }: ListaDatasetsProps) {
  return (
    <ul className="space-y-3">
      {datasets.map((dataset) => {
        const abierto = dataset.id === seleccionado;
        return (
          <li key={dataset.id}>
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle as="h2" className="text-base">
                    {dataset.nombre}
                  </CardTitle>
                  {abierto ? <Badge tone="info">Seleccionado</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dataset.descripcion ?? 'Sin descripción.'}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Casos</dt>
                    <dd className="font-medium tabular-nums">{dataset.total_casos}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">k mínimo</dt>
                    <dd className="font-medium tabular-nums">{dataset.k}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Huella</dt>
                    <dd className="font-mono text-xs">
                      <span title={dataset.huella}>{huellaCorta(dataset.huella)}</span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Creado (UTC)</dt>
                    <dd className="tabular-nums">
                      {FORMATO_FECHA.format(new Date(dataset.creado_en))}
                    </dd>
                  </div>
                </dl>
                <Button
                  variant={abierto ? 'secondary' : 'outline'}
                  size="sm"
                  aria-label={`Abrir ${dataset.nombre}`}
                  aria-pressed={abierto}
                  onClick={() => onSeleccionar(dataset.id)}
                >
                  {abierto ? 'Dataset abierto' : 'Abrir dataset'}
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
