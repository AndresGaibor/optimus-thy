import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'role' | 'value' | 'children' | 'aria-label'
> {
  /** Nombre accesible obligatorio del interruptor. */
  'aria-label': string;
  /** Estado controlado; si se omite, el componente mantiene su estado interno. */
  checked?: boolean;
  /** Estado inicial no controlado (predeterminado: `false`). */
  defaultChecked?: boolean;
  /** Se invoca con el nuevo estado después de una activación no cancelada. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * ## Cuándo usarlo
 * Para activar o desactivar una opción binaria con efecto inmediato.
 * ## Cuándo no usarlo
 * No lo uses para enviar formularios con selección múltiple ni para cambios que requieran una acción explícita de guardar.
 * ## Anatomía
 * - Botón con pista móvil decorativa que refleja el estado activado.
 * ## Accesibilidad
 * Es un `<button>` con `role="switch"`, nombre por `aria-label` obligatorio y estado en `aria-checked`. Enter y Espacio lo activan; el foco visible usa `focus-visible`. El control nativo anuncia deshabilitado.
 * ## Responsive
 * No tiene breakpoints; conserva su tamaño fijo `h-6 w-11` a 360, 768 y 1366 px.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, checked, defaultChecked = false, onCheckedChange, onClick, disabled, ...props },
  ref,
) {
  const [innerChecked, setInnerChecked] = useState(defaultChecked);
  const isChecked = checked ?? innerChecked;

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (checked === undefined) setInnerChecked(!isChecked);
        onCheckedChange?.(!isChecked);
      }}
      className={cn(
        'group inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-muted-foreground bg-surface-subtle p-0.5 transition-colors',
        'aria-checked:border-brand aria-checked:bg-brand',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none block size-4 rounded-full bg-muted-foreground transition-transform group-aria-checked:translate-x-5 group-aria-checked:bg-brand-foreground"
      />
    </button>
  );
});
