import { Search, X } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { Input } from '../atoms/Input';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Nombre accesible del campo (no hay etiqueta visible). */
  label: string;
  /** Si se pasa y hay texto, muestra un botón para limpiar la búsqueda. */
  onClear?: () => void;
  /** Nombre accesible del botón de limpieza; predeterminado `Limpiar búsqueda`. */
  clearLabel?: string;
  /** Clases adicionales para el contenedor del campo. */
  containerClassName?: string;
}

/**
 * Campo de búsqueda con icono visual y botón de limpieza opcional.
 *
 * ## Cuándo usarlo
 * Para filtrar una lista mediante una consulta textual.
 * ## Cuándo no usarlo
 * No usarlo como campo de texto genérico ni sin etiqueta accesible.
 * ## Anatomía
 * - Región `search`, icono decorativo, campo y botón opcional para limpiar.
 * ## Accesibilidad
 * El campo expone `aria-label` con `label`; el botón usa `aria-label` con `clearLabel`, y ambos conservan su foco y teclado nativos. Iconos ocultos con `aria-hidden="true"`.
 * ## Responsive
 * El contenedor ocupa el ancho disponible (`w-full`) en 360, 768 y 1366 px.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    label,
    onClear,
    clearLabel = 'Limpiar búsqueda',
    containerClassName,
    className,
    disabled,
    ...props
  },
  ref,
) {
  const hasText = typeof props.value === 'string' && props.value.length > 0;

  return (
    <div role="search" className={cn('relative w-full', containerClassName)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={ref}
        type="search"
        aria-label={label}
        disabled={disabled}
        className={cn(
          'pl-9 [&::-webkit-search-cancel-button]:hidden',
          onClear ? 'pr-10' : '',
          className,
        )}
        {...props}
      />
      {onClear && hasText ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={onClear}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground hover:bg-border-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
});
