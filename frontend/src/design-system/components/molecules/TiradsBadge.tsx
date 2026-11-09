import { getTiradsTone } from '../../tones';
import { Badge, type BadgeProps } from '../atoms/Badge';

export interface TiradsBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  /** Categoría TI-RADS (1–5, con sufijo opcional). Sin valor reconocible se muestra “Sin clasificar”. */
  value: string | number | null | undefined;
}

function formatLabel(value: TiradsBadgeProps['value']): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 'TI-RADS sin clasificar';
  }
  const text = String(value).trim();
  return /^TI[- ]?RADS/i.test(text) ? text : `TI-RADS ${text}`;
}

/**
 * Distintivo que presenta una categoría TI-RADS como texto y tono semántico.
 *
 * ## Cuándo usarlo
 * Para mostrar la categoría TI-RADS ya obtenida por la aplicación.
 * ## Cuándo no usarlo
 * No usarlo para calcular una categoría ni interpretar imágenes.
 * ## Anatomía
 * - Insignia con etiqueta TI-RADS formateada y tono derivado del valor.
 * ## Accesibilidad
 * La categoría permanece escrita en el texto de `Badge`; el tono no es la única señal. No agrega controles ni interacción de teclado.
 * ## Responsive
 * Hereda presentación en línea de `Badge`; no declara cambios por viewport.
 */
export function TiradsBadge({ value, ...props }: TiradsBadgeProps) {
  return (
    <Badge tone={getTiradsTone(value)} {...props}>
      {formatLabel(value)}
    </Badge>
  );
}
