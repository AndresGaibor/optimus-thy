import {
  DATASET_REQUEST_TONES,
  INFERENCE_STATUS_TONES,
  RECORD_STATUS_TONES,
  USER_ACTIVITY_TONES,
  type BadgeTone,
  type DatasetRequestStatus,
  type InferenceStatus,
  type RecordStatus,
  type UserActivityStatus,
} from '../../tones';
import { Badge, type BadgeProps } from '../atoms/Badge';

const DATASET_REQUEST_LABELS: Record<DatasetRequestStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

/** Variantes internas para asociar una categoría y su estado textual. */
type StatusSpec =
  | {
      /** Categoría de registro. */
      kind: 'record';
      /** Estado textual del registro. */
      status: RecordStatus;
    }
  | {
      /** Categoría de inferencia. */
      kind: 'inference';
      /** Estado textual de inferencia. */
      status: InferenceStatus;
    }
  | {
      /** Categoría de usuario. */
      kind: 'user';
      /** Estado de actividad del usuario. */
      status: UserActivityStatus;
    }
  | {
      /** Categoría de solicitud de conjunto de datos. */
      kind: 'dataset-request';
      /** Estado de la solicitud. */
      status: DatasetRequestStatus;
    };

/** Categoría y estado requerido para una insignia de estado. */
export type StatusBadgeProps = Omit<BadgeProps, 'tone' | 'children'> & StatusSpec;

function resolve(props: StatusSpec): {
  label: string;
  tone: BadgeTone;
} {
  switch (props.kind) {
    case 'record':
      return { label: props.status, tone: RECORD_STATUS_TONES[props.status] };
    case 'inference':
      return { label: props.status, tone: INFERENCE_STATUS_TONES[props.status] };
    case 'user':
      return { label: props.status, tone: USER_ACTIVITY_TONES[props.status] };
    case 'dataset-request':
      return {
        label: DATASET_REQUEST_LABELS[props.status],
        tone: DATASET_REQUEST_TONES[props.status],
      };
  }
}

/** Estado textual con el tono centralizado en `tones.ts`; `Pendiente` es siempre warning. */
/**
 * Insignia textual para estados de registro, inferencia, usuario o solicitud.
 *
 * ## Cuándo usarlo
 * Para mostrar un estado conocido de los tipos compartidos en `tones.ts`.
 * ## Cuándo no usarlo
 * No usarlo para roles, tipos de actividad ni texto arbitrario.
 * ## Anatomía
 * - Insignia con etiqueta de estado y tono resuelto por categoría.
 * ## Accesibilidad
 * El texto comunica el estado además del tono; hereda la presentación de `Badge`, sin controles de teclado o foco propios.
 * ## Responsive
 * Hereda el layout en línea y wrapping de `Badge`; no declara cambios por viewport.
 */
export function StatusBadge({ kind, status, ...props }: StatusBadgeProps) {
  const { label, tone } = resolve({ kind, status } as StatusSpec);

  return (
    <Badge tone={tone} {...props}>
      {label}
    </Badge>
  );
}
