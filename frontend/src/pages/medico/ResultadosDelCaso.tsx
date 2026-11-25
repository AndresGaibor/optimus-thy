import { EmptyState } from '../../design-system';
import type { ImagenCaso } from '../../api/imagenes';
import type { Inferencia } from '../../api/resultados';
import { ResultadoInferencia } from './ResultadoInferencia';

interface ResultadosDelCasoProps {
  resultados: Inferencia[];
  casoId: string;
  /** Ecografías del caso, para indicar con cuál se hizo cada inferencia. */
  imagenes: ImagenCaso[];
}

/** Sección de resultados de un caso: lista de inferencias con su detalle por nódulo. */
export function ResultadosDelCaso({ resultados, casoId, imagenes }: ResultadosDelCasoProps) {
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
          <ResultadoInferencia
            key={inferencia.id}
            inferencia={inferencia}
            casoId={casoId}
            imagen={imagenes.find((imagen) => imagen.id === inferencia.imagen_id)}
          />
        ))
      )}
    </section>
  );
}
