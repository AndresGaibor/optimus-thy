import { ConfidenceBadge, EmptyState } from '../../../design-system';
import type { ImagenCaso } from '../../../api/imagenes';
import type { Inferencia } from '../../../api/resultados';
import { ResultadoInferencia } from '../ResultadoInferencia';

interface PanelResultadosProps {
  /** Inferencias registradas para el caso seleccionado. */
  resultados: Inferencia[];
  /** Caso al que pertenecen los resultados. */
  casoId: string;
  /** Ecografías del caso, para indicar con cuál se hizo cada inferencia. */
  imagenes: ImagenCaso[];
}

/** Sección de resultados de inferencia con la confianza y la evidencia por nódulo. */
export function PanelResultados({ resultados, casoId, imagenes }: PanelResultadosProps) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="resultados-title">
      <h2 id="resultados-title" className="text-lg font-semibold">
        Resultados
      </h2>
      {resultados.length === 0 ? (
        <EmptyState
          title="Sin inferencias"
          description="Analiza una ecografía para ver el resultado por nódulo."
        />
      ) : (
        resultados.map((inferencia) => {
          const confianza =
            inferencia.confianza === null
              ? null
              : Math.min(100, Math.max(0, inferencia.confianza * 100));
          return (
            <article key={inferencia.id} className="flex flex-col gap-3">
              {confianza === null ? null : (
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceBadge value={confianza} tone="ai" label="Confianza del resultado" />
                </div>
              )}
              <ResultadoInferencia
                inferencia={inferencia}
                casoId={casoId}
                imagen={imagenes.find((imagen) => imagen.id === inferencia.imagen_id)}
              />
            </article>
          );
        })
      )}
    </section>
  );
}
