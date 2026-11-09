import { ACTIVITY_TONES, type ActivityType } from '../../tones';
import { Badge, type BadgeProps } from '../atoms/Badge';

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  lectura: 'Lectura',
  exportacion: 'Exportación',
  inferencia: 'Inferencia',
  carga: 'Carga',
  seguridad: 'Seguridad',
  administracion: 'Administración',
  auditoria: 'Auditoría',
};

export interface ActivityTypeBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  /** Tipo de actividad para resolver el texto y el tono centralizados. */
  type: ActivityType;
}

/**
 * Insignia textual para identificar el tipo de actividad registrada.
 *
 * ## Cuándo usarlo
 * Para etiquetar una actividad de auditoría mediante el catálogo `ActivityType`.
 * ## Cuándo no usarlo
 * No usarlo para estados de registros, inferencias ni roles.
 * ## Anatomía
 * - Insignia con el nombre localizado de la actividad y el tono asociado.
 * ## Accesibilidad
 * Renderiza el nombre de actividad como texto dentro de la insignia; no añade `aria-*` ni controles de teclado o foco.
 * ## Responsive
 * Hereda la presentación de `Badge`; el texto permanece visible y el componente no declara cambios por viewport.
 */
export function ActivityTypeBadge({ type, ...props }: ActivityTypeBadgeProps) {
  return (
    <Badge tone={ACTIVITY_TONES[type]} {...props}>
      {ACTIVITY_LABELS[type]}
    </Badge>
  );
}
