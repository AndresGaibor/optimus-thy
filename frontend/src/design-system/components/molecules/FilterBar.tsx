import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../atoms/Button';

export interface FilterBarProps {
  /** Nombre accesible del grupo de filtros. */
  label: string;
  /** Controles de filtro (SearchInput, Select, Field…). */
  children: ReactNode;
  /** Si se pasa, muestra el botón de restablecer. */
  onReset?: () => void;
  /** Nombre accesible del botón; predeterminado `Limpiar filtros`. */
  resetLabel?: string;
  /** Clases adicionales para el grupo. */
  className?: string;
}

/**
 * Agrupa controles de filtrado y ofrece una acción opcional para restablecerlos.
 *
 * ## Cuándo usarlo
 * En listados que necesitan filtros relacionados bajo un nombre común.
 * ## Cuándo no usarlo
 * No usarlo como navegación ni como formulario de búsqueda aislado.
 * ## Anatomía
 * - Grupo con nombre accesible, controles hijos y botón opcional de restablecimiento.
 * ## Accesibilidad
 * El contenedor expone `role="group"` y `aria-label`; el botón conserva su foco y teclado nativos.
 * ## Responsive
 * A 360 px los controles se apilan; desde `sm` (640 px) se distribuyen en fila y pueden envolver, igual a 768 y 1366 px.
 */
export function FilterBar({
  label,
  children,
  onReset,
  resetLabel = 'Limpiar filtros',
  className,
}: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex flex-col gap-3 rounded-card border border-border bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-end',
        className,
      )}
    >
      {children}
      {onReset ? (
        <Button variant="ghost" size="sm" onClick={onReset} className="sm:ml-auto">
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}
