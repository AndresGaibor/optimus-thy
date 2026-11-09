import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  StatusBadge,
  TiradsBadge,
} from '../../design-system';
import type { DemoInference } from '../fixtures/types';

export function ResultsList(props: {
  inferences: DemoInference[];
  onViewReport: (inference: DemoInference) => void;
  onViewOverlay: (inference: DemoInference) => void;
}) {
  const { inferences } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Reportes de inferencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {inferences.length ? (
          inferences.map((x) => (
            <article key={x.id} className="rounded-xl border border-border-subtle p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {x.id} · {x.fecha}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{x.pacienteNombre}</h2>
                  <p className="mt-1">
                    {x.resultado.toLowerCase().includes('sin nódulo') ? (
                      <>
                        <strong>Normal:</strong> sin nódulo detectado.
                      </>
                    ) : (
                      x.resultado
                    )}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {x.modelo} · Confianza ilustrativa {x.confianza}% · Entrada: {x.tipoEntrada}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <StatusBadge kind="inference" status={x.estado} />
                    <TiradsBadge value={x.tiRads} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => props.onViewReport(x)}>
                    Ver reporte
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label={`Ver overlay de ${x.id}`}
                    onClick={() => props.onViewOverlay(x)}
                  >
                    Ver overlay
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No hay resultados disponibles"
            description="Las inferencias completadas se mostrarán aquí."
          />
        )}
      </CardContent>
    </Card>
  );
}
