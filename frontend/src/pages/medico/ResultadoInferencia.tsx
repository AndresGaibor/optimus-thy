import { Badge, Callout } from '../../design-system';
import type { Inferencia } from '../../api/resultados';
import { ResultadoNodulo } from './ResultadoNodulo';

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });
const RESULTADOS: Record<string, { etiqueta: string; tono: 'success' | 'danger' | 'neutral' }> = {
  benigno: { etiqueta: 'Benigno', tono: 'success' },
  maligno: { etiqueta: 'Maligno', tono: 'danger' },
  sin_nodulo: { etiqueta: 'Normal (sin nódulo)', tono: 'neutral' },
};
const SIN_CLASIFICAR = { etiqueta: 'Sin clasificar', tono: 'neutral' as const };

/** Una inferencia con su fecha, modelo y resultado, incluido el caso sin nódulo. */
export function ResultadoInferencia({ inferencia }: { inferencia: Inferencia }) {
  const resultado = RESULTADOS[inferencia.resultado] ?? SIN_CLASIFICAR;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">
          {FORMATO_FECHA.format(new Date(inferencia.creado_en))}
        </h3>
        <Badge tone={resultado.tono}>{resultado.etiqueta}</Badge>
        <span className="text-sm text-muted-foreground">
          {inferencia.modelo.nombre} {inferencia.modelo.version}
        </span>
      </div>
      {inferencia.nodulos.length === 0 ? (
        <Callout tone="success" title="Normal: sin nódulo detectado">
          La inferencia no encontró nódulos en esta ecografía.
        </Callout>
      ) : (
        inferencia.nodulos.map((nodulo) => (
          <ResultadoNodulo
            key={`${inferencia.id}-${nodulo.indice}`}
            nodulo={nodulo}
            modelo={inferencia.modelo}
            creadoEn={inferencia.creado_en}
          />
        ))
      )}
    </div>
  );
}
