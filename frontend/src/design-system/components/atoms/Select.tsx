import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { CONTROL_CLASSES } from './Input';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Clases del contenedor; úselas para definir el ancho. `className` aplica al `<select>`. */
  containerClassName?: string;
}

/**
 * ## Cuándo usarlo
 * Para elegir una opción entre alternativas discretas en un formulario.
 * ## Cuándo no usarlo
 * No lo uses cuando las opciones deban mostrarse todas simultáneamente o admitan selección múltiple.
 * ## Anatomía
 * - `<select>` nativo con sus opciones y un chevrón decorativo.
 * ## Accesibilidad
 * Conserva el rol, nombre, teclado, foco y selección del `<select>` nativo. El chevrón tiene `aria-hidden="true"`; el nombre accesible debe aportarlo la etiqueta asociada o un atributo ARIA.
 * ## Responsive
 * El contenedor `w-full` ocupa el ancho disponible a 360, 768 y 1366 px; no hay reglas por breakpoint.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, containerClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      <select
        ref={ref}
        className={cn(CONTROL_CLASSES, 'h-10 appearance-none py-2 pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
});
