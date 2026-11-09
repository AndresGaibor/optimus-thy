import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Propiedades de la etiqueta HTML. */
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Añade un asterisco visual (predeterminado: `false`); el control debe llevar además `required`. */
  requiredMark?: boolean;
}

/**
 * ## Cuándo usarlo
 * Para dar nombre visible a un control de formulario mediante `htmlFor`.
 * ## Cuándo no usarlo
 * No lo uses como sustituto del control asociado ni para indicar obligatoriedad solo con el asterisco.
 * ## Anatomía
 * - Texto de etiqueta y, opcionalmente, un asterisco visual.
 * ## Accesibilidad
 * Renderiza `<label>` y mantiene la asociación nativa por `htmlFor`; no tiene teclado ni foco propios. El asterisco usa `aria-hidden="true"` y no anuncia que el campo sea obligatorio.
 * ## Responsive
 * No tiene breakpoints ni reglas de ancho; el texto fluye en su contenedor a 360, 768 y 1366 px.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, requiredMark, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none text-foreground', className)}
      {...props}
    >
      {children}
      {requiredMark ? (
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      ) : null}
    </label>
  );
});
