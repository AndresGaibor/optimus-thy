import { Button } from '../atoms/Button';
import { cn } from '../../lib/cn';

export interface PaginationProps {
  /** Total de elementos que devuelve el servidor. */
  total: number;
  /** Elementos por página. */
  limit: number;
  /** Posición del primer elemento visible (0 = primera página). */
  offset: number;
  /** Notifica el nuevo desplazamiento al cambiar de página. */
  onOffsetChange: (offset: number) => void;
  /** Texto del total, p. ej. `usuario` → «Total: 3 usuarios»; predeterminado `elemento`. */
  itemLabel?: string;
  /** Clases adicionales para la navegación. */
  className?: string;
}

/** Paginación por desplazamiento: Anterior / Página X de Y / Siguiente. */
/**
 * Permite recorrer resultados usando total, límite y desplazamiento.
 *
 * ## Cuándo usarlo
 * Debajo de una lista con paginación por desplazamiento.
 * ## Cuándo no usarlo
 * No usarlo para paginación por cursor ni cuando el total sea desconocido.
 * ## Anatomía
 * - Total de elementos; botones Anterior/Siguiente; número de página actual.
 * ## Accesibilidad
 * La navegación usa `aria-label="Paginación"` y el estado de página `aria-live="polite"`; botones nativos conservan foco y teclado y anuncian su estado deshabilitado.
 * ## Responsive
 * A 360 px total y controles se apilan; desde `sm` (640 px) se alinean en fila, también a 768 y 1366 px.
 */
export function Pagination({
  total,
  limit,
  offset,
  onOffsetChange,
  itemLabel = 'elemento',
  className,
}: PaginationProps) {
  const paginaActual = Math.floor(offset / limit) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / limit));
  const puedeAnterior = offset > 0;
  const puedeSiguiente = offset + limit < total;

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex flex-col items-center justify-between gap-2 sm:flex-row', className)}
    >
      <p className="text-sm text-muted-foreground">
        Total: {total} {itemLabel}
        {total === 1 ? '' : 's'}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!puedeAnterior}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          Anterior
        </Button>
        <span aria-live="polite" className="text-sm text-muted-foreground">
          Página {paginaActual} de {totalPaginas}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!puedeSiguiente}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
