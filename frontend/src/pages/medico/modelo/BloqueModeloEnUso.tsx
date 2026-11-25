import { Button } from '../../../design-system/components/atoms/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { Spinner } from '../../../design-system/components/atoms/Spinner';
import { Callout } from '../../../design-system/components/molecules/Callout';
import { EmptyState } from '../../../design-system/components/molecules/EmptyState';
import { formatearFecha } from './compartidos';
import { useModeloEnUso } from './useModeloEnUso';

/**
 * Ficha del modelo que produjo la inferencia más reciente de la institución.
 *
 * Solo este bloque depende de la API: si falla, la explicación de la página
 * sigue visible y aquí se ofrece reintentar.
 */
export function BloqueModeloEnUso() {
  const { modelo, cargando, error, recargar } = useModeloEnUso();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Modelo de la última inferencia</CardTitle>
        <CardDescription>
          Versión y huella de los pesos con los que se generó el resultado más reciente de tu
          institución. Sirve para comprobar qué modelo lo produjo y si cambió desde entonces.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <Spinner size="lg" label="Consultando la versión del modelo" />
        ) : error ? (
          <Callout tone="danger" role="alert" title="No se pudo consultar el modelo">
            {error} La explicación del resto de la página sigue disponible.
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={() => void recargar()}>
                Reintentar
              </Button>
            </div>
          </Callout>
        ) : modelo ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Modelo</dt>
              <dd className="font-medium text-foreground">{modelo.nombre}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Versión</dt>
              <dd className="font-medium text-foreground">{modelo.version}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Huella de los pesos (SHA-256)</dt>
              <dd>
                <code className="break-all font-mono text-xs text-foreground">
                  {modelo.huella ?? 'No registrada en esta inferencia'}
                </code>
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Inferencia del</dt>
              <dd className="text-sm text-foreground">{formatearFecha(modelo.inferenciaEn)}</dd>
            </div>
          </dl>
        ) : (
          <EmptyState
            as="h3"
            title="Sin modelo en uso"
            description="Todavía no hay inferencias registradas en tu institución. Cuando exista un resultado, aquí verás la versión y la huella de los pesos con los que se generó."
          />
        )}
      </CardContent>
    </Card>
  );
}
