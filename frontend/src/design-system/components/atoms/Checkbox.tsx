import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Clases base para casillas; el estado de error se expresa con `aria-invalid`. */
const CHECKBOX_CLASSES =
  'size-4 shrink-0 rounded border border-input bg-background text-brand accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

/** Propiedades de la casilla nativa; se excluye `type` porque siempre es `checkbox`. */
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * ## Cuándo usarlo
 * Para permitir seleccionar o deseleccionar una opción independiente.
 * ## Cuándo no usarlo
 * No lo uses para opciones mutuamente excluyentes; usa controles de selección apropiados.
 * ## Anatomía
 * - Casilla nativa cuadrada; la etiqueta se aporta desde fuera.
 * ## Accesibilidad
 * Conserva el rol, teclado, foco y nombre del `<input type="checkbox">`. Requiere nombre accesible mediante `<Label htmlFor>`, `aria-label` o `aria-labelledby`; `aria-invalid` comunica error y `disabled` bloquea la interacción.
 * ## Responsive
 * No tiene breakpoints; mantiene su tamaño `size-4` a 360, 768 y 1366 px.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return <input ref={ref} type="checkbox" className={cn(CHECKBOX_CLASSES, className)} {...props} />;
});
