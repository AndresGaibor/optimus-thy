import type { Dataset } from '../../../api/datasets';
import { Badge } from '../../../design-system/components/atoms/Badge';
import { Button } from '../../../design-system/components/atoms/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { Spinner } from '../../../design-system/components/atoms/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../design-system/components/atoms/Table';
import { Callout } from '../../../design-system/components/molecules/Callout';
import { EmptyState } from '../../../design-system/components/molecules/EmptyState';
import { COLUMNAS_CASO, FORMATO_FECHA, huellaCorta, valorCaso } from './compartidos';

export interface DetalleDatasetProps {
  id: string | null;
  dataset: Dataset | null;
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
}

/** Filas anonimizadas del conjunto elegido, sin identificadores de pacientes. */
export function DetalleDataset({
  id,
  dataset,
  cargando,
  error,
  onReintentar,
}: DetalleDatasetProps) {
  if (!id) {
    return (
      <EmptyState
        title="Elige un dataset"
        description="Selecciona un conjunto de la lista para consultar sus filas anonimizadas."
      />
    );
  }

  if (error) {
    return (
      <Callout tone="danger" role="alert">
        {error}
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      </Callout>
    );
  }

  if (cargando || !dataset) {
    return <Spinner size="lg" label="Cargando filas del dataset" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle as="h2" className="text-lg">
            {dataset.nombre}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{dataset.total_casos} casos</Badge>
            <Badge tone="neutral">k = {dataset.k}</Badge>
          </div>
        </div>
        <CardDescription>{dataset.descripcion ?? 'Sin descripción.'}</CardDescription>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Huella</dt>
            <dd className="font-mono text-xs">
              <span title={dataset.huella}>{huellaCorta(dataset.huella)}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Creado (UTC)</dt>
            <dd className="tabular-nums">{FORMATO_FECHA.format(new Date(dataset.creado_en))}</dd>
          </div>
        </dl>
      </CardHeader>
      <CardContent>
        {dataset.items.length === 0 ? (
          <EmptyState
            title="Sin filas anonimizadas"
            description="El conjunto no publicó filas; revisa sus criterios de inclusión."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table caption="Filas anonimizadas del dataset">
              <TableHeader>
                <TableRow>
                  {COLUMNAS_CASO.map((columna) => (
                    <TableHead key={columna.clave} className="whitespace-nowrap">
                      {columna.titulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.items.map((fila, indice) => (
                  <TableRow key={`${fila.sujeto}-${indice}`}>
                    {COLUMNAS_CASO.map((columna) => (
                      <TableCell key={columna.clave} className="whitespace-nowrap">
                        {valorCaso(fila, columna.clave)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
