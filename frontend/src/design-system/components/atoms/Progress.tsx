import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

export interface ProgressProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'role' | 'children' | 'aria-label'
> {
  /** Nombre anunciado para la barra. */
  label: string;
  /** Valor actual entre cero y `max`; sin valor la barra es indeterminada. */
  value?: number;
  /** Valor máximo (predeterminado: `100`). */
  max?: number;
  /** Tono visual del indicador (predeterminado: `info`). */
  tone?: BadgeTone;
}

/**
 * ## Cuándo usarlo
 * Para comunicar el avance cuantificable o indeterminado de una operación.
 * ## Cuándo no usarlo
 * No lo uses como único anuncio de cambios urgentes ni sin una descripción accesible.
 * ## Anatomía
 * - Canal de fondo y segmento indicador, con ancho proporcional cuando hay valor.
 * ## Accesibilidad
 * Tiene `role="progressbar"`, nombre por `aria-label` y valores `aria-valuemin`, `aria-valuemax` y `aria-valuenow`; no recibe foco ni teclado.
 * ## Responsive
 * `w-full` ocupa el ancho de su contenedor a 360, 768 y 1366 px; no hay reglas por breakpoint.
 */
export function Progress({
  label,
  value,
  max = 100,
  tone = 'info',
  className,
  ...props
}: ProgressProps) {
  const hasValue = value !== undefined;
  const clamped = hasValue ? Math.min(Math.max(value, 0), max) : undefined;
  const percent = clamped !== undefined && max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-border', className)}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width]',
          TONE_CLASSES[tone].marker,
          hasValue ? '' : 'w-1/3 animate-pulse motion-reduce:animate-none',
        )}
        style={hasValue ? { width: `${percent}%` } : undefined}
      />
    </div>
  );
}
