import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Nombre accesible de la tabla y de su región desplazable. */
  caption: string;
  /** Clases del contenedor con desplazamiento horizontal. */
  containerClassName?: string;
}

/**
 * ## Cuándo usarlo
 * Para presentar datos relacionados con encabezados de filas o columnas.
 * ## Cuándo no usarlo
 * No lo uses para maquetación; usa estructuras de contenido y componentes de superficie.
 * ## Anatomía
 * - Región desplazable con nombre, tabla, caption accesible, encabezado, cuerpo, filas, celdas de encabezado y celdas de datos.
 * ## Accesibilidad
 * El contenedor tiene `role="region"`, `aria-label={caption}` y `tabIndex={0}` para permitir desplazamiento con teclado. La tabla incluye un `<caption className="sr-only">`; los encabezados `TableHead` usan `scope="col"` de forma predeterminada.
 * ## Responsive
 * La región usa `w-full overflow-x-auto`: en 360 px desplaza horizontalmente si la tabla no cabe; en 768 y 1366 px ocupa el ancho disponible sin cambio por breakpoint.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { caption, className, containerClassName, children, ...props },
  ref,
) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn(
        'relative w-full overflow-x-auto rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        containerClassName,
      )}
    >
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
});

/**
 * ## Cuándo usarlo
 * Para agrupar las filas de encabezado al inicio de una tabla.
 * ## Cuándo no usarlo
 * No lo uses para filas de datos; esas pertenecen a `TableBody`.
 * ## Anatomía
 * - Sección de encabezado de `Table`, contiene normalmente filas `TableRow` con `TableHead`.
 * ## Accesibilidad
 * Renderiza `<thead>` y no añade atributos `aria-*`; agrupa los encabezados de columna en el orden del DOM.
 * ## Responsive
 * No añade clases responsive; se comporta como sección nativa de tabla a 360, 768 y 1366 px.
 */
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />;
});

/**
 * ## Cuándo usarlo
 * Para agrupar las filas de datos de una tabla.
 * ## Cuándo no usarlo
 * No lo uses para encabezados; esos pertenecen a `TableHeader`.
 * ## Anatomía
 * - Sección de datos de `Table`, contiene filas `TableRow` con celdas `TableCell`.
 * ## Accesibilidad
 * Renderiza `<tbody>` y no añade atributos `aria-*`; mantiene la agrupación semántica de las filas.
 * ## Responsive
 * No añade clases responsive; se comporta como sección nativa de tabla a 360, 768 y 1366 px.
 */
export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
});

/**
 * ## Cuándo usarlo
 * Para agrupar celdas relacionadas en una fila de encabezado o de datos.
 * ## Cuándo no usarlo
 * No lo uses fuera de `thead` o `tbody` ni para crear filas de maquetación.
 * ## Anatomía
 * - Fila `<tr>` dentro de `TableHeader` o `TableBody`, con `TableHead` y/o `TableCell`.
 * ## Accesibilidad
 * Renderiza `<tr>` y no añade atributos `aria-*`; conserva la asociación estructural de sus celdas.
 * ## Responsive
 * Usa `border-b`, `hover:bg-surface-subtle` y `aria-selected:bg-surface-subtle`, sin breakpoints, a 360, 768 y 1366 px.
 */
export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  function TableRow({ className, ...props }, ref) {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-border transition-colors hover:bg-surface-subtle aria-selected:bg-surface-subtle',
          className,
        )}
        {...props}
      />
    );
  },
);

/**
 * ## Cuándo usarlo
 * Para nombrar una columna en el encabezado de la tabla.
 * ## Cuándo no usarlo
 * No lo uses para valores de datos; esos pertenecen a `TableCell`.
 * ## Anatomía
 * - Celda `<th>` en una fila de `TableHeader`; `scope` es `col` por defecto.
 * ## Accesibilidad
 * Renderiza `<th scope={scope}>` con valor predeterminado `scope="col"`; no añade otros atributos `aria-*`.
 * ## Responsive
 * Usa `h-11 whitespace-nowrap px-4 text-left align-middle text-sm`; no cambia por breakpoint a 360, 768 y 1366 px.
 */
export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, scope = 'col', ...props }, ref) {
    return (
      <th
        ref={ref}
        scope={scope}
        className={cn(
          'h-11 whitespace-nowrap px-4 text-left align-middle text-sm font-medium text-muted-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);

/**
 * ## Cuándo usarlo
 * Para presentar un valor de datos dentro de una fila de tabla.
 * ## Cuándo no usarlo
 * No lo uses para nombrar una columna; usa `TableHead` dentro de `TableHeader`.
 * ## Anatomía
 * - Celda `<td>` de una fila `TableRow` en `TableBody`.
 * ## Accesibilidad
 * Renderiza `<td>` sin añadir atributos `aria-*`; su contexto de fila y encabezados aporta la estructura tabular.
 * ## Responsive
 * Usa `px-4 py-3 align-middle` sin breakpoints; permanece como celda de tabla a 360, 768 y 1366 px.
 */
export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...props }, ref) {
    return <td ref={ref} className={cn('px-4 py-3 align-middle', className)} {...props} />;
  },
);
