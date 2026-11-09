import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const spinnerVariants = cva('inline-flex shrink-0 items-center justify-center', {
  variants: {
    /** Tamaño del icono: sm, default o lg (predeterminado: default). */
    size: {
      sm: '[&>svg]:size-3.5',
      default: '[&>svg]:size-4',
      lg: '[&>svg]:size-6',
    },
  },
  defaultVariants: { size: 'default' },
});

/** Propiedades del indicador de carga. */
export interface SpinnerProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>, VariantProps<typeof spinnerVariants> {
  /**
   * Texto accesible. Con `label` el spinner se anuncia como estado de carga;
   * sin `label` es decorativo y queda oculto para lectores de pantalla.
   */
  label?: string;
}

/**
 * ## Cuándo usarlo
 * Para indicar visualmente una operación que sigue en curso.
 * ## Cuándo no usarlo
 * No lo uses sin contexto que explique la carga ni como único mensaje de error o progreso cuantificado.
 * ## Anatomía
 * - Icono circular animado y, si hay `label`, texto solo para lectores de pantalla.
 * ## Accesibilidad
 * Con `label`, el contenedor tiene `role="status"` y anuncia ese texto; sin etiqueta tiene `aria-hidden="true"`. El SVG se oculta con `aria-hidden="true"`. No recibe foco ni teclado.
 * ## Responsive
 * No tiene breakpoints; el tamaño del icono sigue `size` (`sm`, `default` o `lg`) a 360, 768 y 1366 px.
 */
export function Spinner({ label, size, className, ...props }: SpinnerProps) {
  return (
    <span
      {...(label ? { role: 'status' } : { 'aria-hidden': true })}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
