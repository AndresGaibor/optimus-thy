import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

/** Propiedades del distintivo semántico. */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Tono semántico (predeterminado: `neutral`). El contenido siempre debe llevar texto: el color no es el único canal. */
  tone?: BadgeTone;
}

/**
 * ## Cuándo usarlo
 * Para mostrar una etiqueta breve que identifique un estado o categoría.
 * ## Cuándo no usarlo
 * No lo uses como botón ni para comunicar un estado solo mediante color.
 * ## Anatomía
 * - Texto siempre visible; admite iconos SVG decorativos junto al texto.
 * ## Accesibilidad
 * Es texto en línea (`span`), sin rol interactivo ni teclado propio. El texto da el nombre y significado; ningún `aria-*` se añade internamente.
 * ## Responsive
 * No tiene breakpoints; conserva una sola línea (`whitespace-nowrap`) en 360, 768 y 1366 px. El contenedor debe reservar ancho suficiente.
 */

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3 [&_svg]:shrink-0',
        TONE_CLASSES[tone].soft,
        className,
      )}
      {...props}
    />
  );
}
