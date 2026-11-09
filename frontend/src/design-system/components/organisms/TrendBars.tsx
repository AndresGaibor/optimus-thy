import { cn } from '../../lib/cn';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

export interface TrendBarItem {
  /** Etiqueta mostrada bajo la barra. */
  label: string;
  /** Valor numérico cuya altura relativa representa la barra. */
  value: number;
  /** Texto del valor ya formateado (p. ej. “92 %”); por defecto, `value`. */
  valueLabel?: string;
  /** Tono de la barra; por defecto, `info`. */
  tone?: BadgeTone;
}

export interface TrendBarsProps {
  /** Elementos que componen la serie. */
  items: TrendBarItem[];
  /** Título de la figura, también su nombre accesible. */
  caption: string;
  /** Valor que ocupa el 100 % de la altura; por defecto, el mayor de los valores. */
  max?: number;
  /** Clases adicionales para la figura. */
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para comparar visualmente valores de una serie y conservar su valor textual.
 * ## Cuándo no usarlo
 * No lo uses cuando los valores necesiten escala temporal o interacción de gráfico.
 * ## Anatomía
 * Figura con título, lista ordenada de etiquetas, barras decorativas y valores escritos.
 * ## Accesibilidad
 * `<figcaption>` nombra la figura; `<ol aria-label={caption}>` presenta elementos en orden. Las barras visuales usan `aria-hidden="true"` y cada valor se anuncia como texto.
 * ## Responsive
 * No hay reglas por breakpoint: las barras comparten el ancho disponible mediante `flex`; las etiquetas largas se truncan. Fluye a 360, 768 y 1366 px.
 */
export function TrendBars({ items, caption, max, className }: TrendBarsProps) {
  const ceiling = max ?? Math.max(0, ...items.map((item) => item.value));

  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <figcaption className="text-sm font-medium text-foreground">{caption}</figcaption>
      <ol aria-label={caption} className="flex items-stretch gap-2">
        {items.map((item) => {
          const percent =
            ceiling > 0 ? Math.min(Math.max((item.value / ceiling) * 100, 0), 100) : 0;
          return (
            <li
              key={item.label}
              className="flex min-w-0 flex-1 flex-col-reverse items-center gap-1"
            >
              <span className="max-w-full truncate text-xs text-muted-foreground">
                {item.label}
              </span>
              <div aria-hidden="true" className="flex h-32 w-full items-end justify-center">
                <div
                  className={cn(
                    'min-h-px w-full max-w-10 rounded-t-control',
                    TONE_CLASSES[item.tone ?? 'info'].marker,
                  )}
                  style={{ height: `${percent}%` }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {item.valueLabel ?? String(item.value)}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
