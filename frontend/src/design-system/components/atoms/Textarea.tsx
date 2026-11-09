import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { CONTROL_CLASSES } from './Input';

/** Propiedades HTML nativas del campo multilínea. */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * ## Cuándo usarlo
 * Para entradas de texto que pueden ocupar varias líneas.
 * ## Cuándo no usarlo
 * No lo uses para un valor corto de una sola línea; usa `Input`.
 * ## Anatomía
 * - Área de texto nativa de altura mínima y contenido redimensionable según el navegador.
 * ## Accesibilidad
 * Conserva rol, teclado, foco y nombre del `<textarea>` nativo; el nombre accesible debe aportarlo la etiqueta asociada o un atributo ARIA. `aria-invalid` comunica error.
 * ## Responsive
 * `w-full` ocupa el ancho disponible a 360, 768 y 1366 px; la altura mínima es `min-h-24` y no cambia por breakpoint.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea ref={ref} className={cn(CONTROL_CLASSES, 'min-h-24 py-2', className)} {...props} />
  );
});
