import { Badge, type BadgeProps } from '../atoms/Badge';

const PERCENT_FORMAT = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

export interface ConfidenceBadgeProps extends Omit<BadgeProps, 'children'> {
  /** Porcentaje (0–100) aportado por quien muestra el dato. */
  value: number;
  /** Prefijo textual. */
  label?: string;
}

/** El tono lo decide el llamador (fixture/story); este componente no define umbrales. */
/**
 * Insignia compacta que muestra un porcentaje proporcionado por la aplicación.
 *
 * ## Cuándo usarlo
 * Para acompañar una cifra de confianza ya calculada por quien llama.
 * ## Cuándo no usarlo
 * No usarlo para calcular umbrales o decidir el tono clínico.
 * ## Anatomía
 * - Texto opcional de etiqueta y porcentaje; el tono se hereda de `Badge`.
 * ## Accesibilidad
 * El porcentaje queda como texto legible en la insignia; no agrega `aria-*`, controles, foco ni interacción de teclado.
 * ## Responsive
 * Hereda el ajuste en línea y el wrapping de `Badge`; no define cambios por viewport.
 */
export function ConfidenceBadge({
  value,
  label = 'Confianza',
  tone,
  ...props
}: ConfidenceBadgeProps) {
  return (
    <Badge tone={tone ?? 'neutral'} {...props}>
      {label} {PERCENT_FORMAT.format(value)} %
    </Badge>
  );
}
