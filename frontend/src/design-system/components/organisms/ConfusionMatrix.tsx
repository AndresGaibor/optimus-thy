import { cn } from '../../lib/cn';

export interface ConfusionMatrixProps {
  /** Clases en el mismo orden para filas (reales) y columnas (predichas). */
  classes: string[];
  /** `values[fila][columna]`: recuentos aportados por quien muestra el dato. */
  values: number[][];
  /** Nombre accesible de la matriz. */
  caption: string;
  /** Texto de la cabecera de filas; por defecto, «Real». */
  rowLabel?: string;
  /** Texto de la cabecera de columnas; por defecto, «Predicho». */
  columnLabel?: string;
  /** Formatea cada recuento; por defecto, usa `Intl.NumberFormat('es')`. */
  formatValue?: (value: number) => string;
  /** Clases adicionales para la región desplazable. */
  className?: string;
}

const DEFAULT_FORMAT = new Intl.NumberFormat('es');

/**
 * ## Cuándo usarlo
 * Para presentar recuentos cruzados entre clases reales y predichas.
 * ## Cuándo no usarlo
 * No lo uses para datos que no formen una matriz cuadrada de clases.
 * ## Anatomía
 * Región desplazable con nombre, tabla, título, cabeceras de fila y columna y celdas con recuento.
 * ## Accesibilidad
 * La región usa `role="region"`, `aria-label={caption}` y `tabIndex={0}`; la tabla incluye `<caption>` y cabeceras con `scope`. El contenedor puede recibir foco y desplazarse por teclado.
 * ## Responsive
 * A 360, 768 y 1366 px ocupa `w-full`; si la tabla es más ancha que el contenedor, `overflow-x-auto` permite desplazarla horizontalmente.
 */
export function ConfusionMatrix({
  classes,
  values,
  caption,
  rowLabel = 'Real',
  columnLabel = 'Predicho',
  formatValue = (value) => DEFAULT_FORMAT.format(value),
  className,
}: ConfusionMatrixProps) {
  const max = Math.max(1, ...values.flat());

  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn(
        'w-full overflow-x-auto rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <table className="w-full border-collapse text-center text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <td />
            <th
              scope="colgroup"
              colSpan={classes.length}
              className="px-3 py-2 text-xs text-muted-foreground"
            >
              {columnLabel}
            </th>
          </tr>
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs text-muted-foreground">
              {rowLabel}
            </th>
            {classes.map((name) => (
              <th key={name} scope="col" className="px-3 py-2 font-medium text-foreground">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((rowName, rowIndex) => (
            <tr key={rowName}>
              <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">
                {rowName}
              </th>
              {classes.map((columnName, columnIndex) => {
                const value = values[rowIndex]?.[columnIndex] ?? 0;
                return (
                  <td key={columnName} className="relative border border-border p-0 tabular-nums">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-brand"
                      style={{ opacity: (value / max) * 0.35 }}
                    />
                    <span
                      className={cn(
                        'relative block px-3 py-4 text-foreground',
                        rowIndex === columnIndex ? 'font-bold' : 'font-normal',
                      )}
                    >
                      {formatValue(value)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
