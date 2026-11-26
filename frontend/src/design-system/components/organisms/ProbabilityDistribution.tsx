import { cn } from '../../lib/cn';
import { TONE_CLASSES } from '../../tones';

export interface ProbabilityBin {
  rango: string;
  negativos: number;
  positivos: number;
}

export interface ProbabilityDistributionProps {
  bins: ProbabilityBin[];
  caption: string;
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para comparar recuentos negativos y positivos por rango de probabilidad.
 * ## Cuándo no usarlo
 * No lo uses cuando las series tengan unidades o escalas incompatibles.
 * ## Anatomía
 * Figura con leyenda, barras por rango, recuentos y tabla plegable.
 * ## Accesibilidad
 * La leyenda nombra cada serie y los recuentos escritos complementan las barras.
 * ## Responsive
 * Las barras y etiquetas fluyen al ancho disponible sin perder su lectura.
 */
export function ProbabilityDistribution({
  bins,
  caption,
  className,
}: ProbabilityDistributionProps) {
  const maximum = Math.max(1, ...bins.map(({ negativos, positivos }) => negativos + positivos));
  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <figcaption className="text-sm font-medium text-foreground">{caption}</figcaption>
      <ul aria-label="Series" className="flex flex-wrap gap-4 text-sm">
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn('size-3 rounded-control', TONE_CLASSES.info.marker)}
          />
          Negativos
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('size-3 rounded-control', 'bg-brand')} />
          Positivos
        </li>
      </ul>
      {bins.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin datos de distribución</p>
      )}
      <ol aria-label={caption} className="space-y-3">
        {bins.map(({ rango, negativos, positivos }) => (
          <li key={rango} className="flex min-w-0 items-center gap-3 text-sm">
            <span className="w-20 shrink-0">{rango}</span>
            <div
              aria-hidden="true"
              className="flex h-3 min-w-0 flex-1 overflow-hidden rounded-control"
            >
              <span
                className={TONE_CLASSES.info.marker}
                style={{ width: `${(negativos / maximum) * 100}%` }}
              />
              <span className={'bg-brand'} style={{ width: `${(positivos / maximum) * 100}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
              {negativos} / {positivos}
            </span>
          </li>
        ))}
      </ol>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-primary">
          Ver tabla equivalente
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2">
                  Rango
                </th>
                <th scope="col" className="border-b border-border px-3 py-2">
                  Negativos
                </th>
                <th scope="col" className="border-b border-border px-3 py-2">
                  Positivos
                </th>
              </tr>
            </thead>
            <tbody>
              {bins.map(({ rango, negativos, positivos }) => (
                <tr key={rango}>
                  <th scope="row" className="border-b border-border px-3 py-2 font-medium">
                    {rango}
                  </th>
                  <td className="border-b border-border px-3 py-2 tabular-nums">{negativos}</td>
                  <td className="border-b border-border px-3 py-2 tabular-nums">{positivos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
