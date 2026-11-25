import { EmptyState } from '../../design-system';
import type { Inferencia } from '../../api/resultados';
import { ResultadoInferencia } from './ResultadoInferencia';

interface ResultadosDelCasoProps {
  resultados: Inferencia[];
  casoId: string;
}

/** Sección de resultados de un caso: lista de inferencias con su detalle por nódulo. */
export function ResultadosDelCaso({ resultados, casoId }: ResultadosDelCasoProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Resultados</h2>
      {resultados.length === 0 ? (
        <EmptyState
          title="Sin inferencias"
          description="Analiza una ecografía para ver el resultado por nódulo."
        />
      ) : (
        resultados.map((inferencia) => (
          <ResultadoInferencia key={inferencia.id} inferencia={inferencia} casoId={casoId} />
        ))
      )}
    </section>
  );
}
