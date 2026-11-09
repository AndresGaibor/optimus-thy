export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'attention' | 'danger' | 'ai';

export type RoleKey = 'medico' | 'investigador' | 'administrador';
export type RecordStatus = 'Completa' | 'En OCR' | 'Revisión' | 'Pendiente';
export type InferenceStatus = 'Completado' | 'En cola' | 'En proceso' | 'Error';
export type UserActivityStatus = 'Activo' | 'Inactivo';
export type DatasetRequestStatus = 'pendiente' | 'aprobado' | 'rechazado';
export type ActivityType =
  'lectura' | 'exportacion' | 'inferencia' | 'carga' | 'seguridad' | 'administracion' | 'auditoria';

export const ROLE_LABELS: Record<RoleKey, string> = {
  medico: 'Médico',
  investigador: 'Investigador',
  administrador: 'Administrador',
};

export const ROLE_TONE_CLASSES: Record<RoleKey, string> = {
  medico: 'role-doctor',
  investigador: 'role-researcher',
  administrador: 'role-admin',
};

export const RECORD_STATUS_TONES: Record<RecordStatus, BadgeTone> = {
  Completa: 'success',
  'En OCR': 'info',
  Revisión: 'warning',
  Pendiente: 'warning',
};

export const INFERENCE_STATUS_TONES: Record<InferenceStatus, BadgeTone> = {
  Completado: 'success',
  'En cola': 'warning',
  'En proceso': 'info',
  Error: 'danger',
};

export const USER_ACTIVITY_TONES: Record<UserActivityStatus, BadgeTone> = {
  Activo: 'success',
  Inactivo: 'neutral',
};

export const DATASET_REQUEST_TONES: Record<DatasetRequestStatus, BadgeTone> = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
};

export const ACTIVITY_TONES: Record<ActivityType, BadgeTone> = {
  lectura: 'info',
  exportacion: 'neutral',
  inferencia: 'ai',
  carga: 'success',
  seguridad: 'danger',
  administracion: 'attention',
  auditoria: 'attention',
};

const TIRADS_TONES: Record<'1' | '2' | '3' | '4' | '5', BadgeTone> = {
  '1': 'success',
  '2': 'success',
  '3': 'warning',
  '4': 'danger',
  '5': 'danger',
};

export function getTiradsTone(value: string | number | null | undefined): BadgeTone {
  if (value === null || value === undefined) return 'neutral';

  const normalized = String(value)
    .trim()
    .match(/^(?:TI[- ]?RADS\s*)?([1-5])(?:[ABC])?$/i)?.[1];
  if (!normalized) return 'neutral';

  return TIRADS_TONES[normalized as keyof typeof TIRADS_TONES];
}

/**
 * Clases Tailwind estáticas por tono. Cada cadena está escrita completa para que
 * el escáner de Tailwind la detecte; nunca se construyen nombres de clase dinámicos.
 */
export interface ToneClasses {
  /** Etiqueta suave con borde (Badge). */
  soft: string;
  /** Superficie suave con borde para avisos y notificaciones. */
  surface: string;
  /** Color de texto o icono. */
  text: string;
  /** Fondo sólido con su foreground accesible. */
  solid: string;
  /** Fondo de marcadores, puntos y barras. */
  marker: string;
  /** Trazo SVG. */
  stroke: string;
  /** Relleno SVG de texto. */
  fill: string;
  /** Relleno SVG suave de áreas. */
  areaFill: string;
}

export const TONE_CLASSES: Record<BadgeTone, ToneClasses> = {
  neutral: {
    soft: 'border-border bg-surface-subtle text-foreground',
    surface: 'border-border bg-surface-subtle',
    text: 'text-muted-foreground',
    solid: 'bg-primary text-primary-foreground',
    marker: 'bg-muted-foreground',
    stroke: 'stroke-muted-foreground',
    fill: 'fill-muted-foreground',
    areaFill: 'fill-muted-foreground/15',
  },
  info: {
    soft: 'border-info/30 bg-info/10 text-info',
    surface: 'border-info/30 bg-info/10',
    text: 'text-info',
    solid: 'bg-info text-info-foreground',
    marker: 'bg-info',
    stroke: 'stroke-info',
    fill: 'fill-info',
    areaFill: 'fill-info/15',
  },
  success: {
    soft: 'border-success/30 bg-success/10 text-success',
    surface: 'border-success/30 bg-success/10',
    text: 'text-success',
    solid: 'bg-success text-success-foreground',
    marker: 'bg-success',
    stroke: 'stroke-success',
    fill: 'fill-success',
    areaFill: 'fill-success/15',
  },
  warning: {
    soft: 'border-warning/30 bg-warning/10 text-warning',
    surface: 'border-warning/30 bg-warning/10',
    text: 'text-warning',
    solid: 'bg-warning text-warning-foreground',
    marker: 'bg-warning',
    stroke: 'stroke-warning',
    fill: 'fill-warning',
    areaFill: 'fill-warning/15',
  },
  attention: {
    soft: 'border-attention/30 bg-attention/10 text-attention',
    surface: 'border-attention/30 bg-attention/10',
    text: 'text-attention',
    solid: 'bg-attention text-attention-foreground',
    marker: 'bg-attention',
    stroke: 'stroke-attention',
    fill: 'fill-attention',
    areaFill: 'fill-attention/15',
  },
  danger: {
    soft: 'border-danger/30 bg-danger/10 text-danger',
    surface: 'border-danger/30 bg-danger/10',
    text: 'text-danger',
    solid: 'bg-danger text-danger-foreground',
    marker: 'bg-danger',
    stroke: 'stroke-danger',
    fill: 'fill-danger',
    areaFill: 'fill-danger/15',
  },
  ai: {
    soft: 'border-ai/30 bg-ai/10 text-ai',
    surface: 'border-ai/30 bg-ai/10',
    text: 'text-ai',
    solid: 'bg-ai text-ai-foreground',
    marker: 'bg-ai',
    stroke: 'stroke-ai',
    fill: 'fill-ai',
    areaFill: 'fill-ai/15',
  },
};

export interface RoleClasses {
  /** Etiqueta suave con borde. */
  soft: string;
  /** Color de texto o icono. */
  text: string;
  /** Fondo sólido con su foreground accesible. */
  solid: string;
  /** Fondo suave para contenedores de icono. */
  tint: string;
  /** Borde de acento. */
  border: string;
}

export const ROLE_CLASSES: Record<RoleKey, RoleClasses> = {
  medico: {
    soft: 'border-role-doctor/30 bg-role-doctor/10 text-role-doctor',
    text: 'text-role-doctor',
    solid: 'bg-role-doctor text-role-doctor-foreground',
    tint: 'bg-role-doctor/10',
    border: 'border-role-doctor/40',
  },
  investigador: {
    soft: 'border-role-researcher/30 bg-role-researcher/10 text-role-researcher',
    text: 'text-role-researcher',
    solid: 'bg-role-researcher text-role-researcher-foreground',
    tint: 'bg-role-researcher/10',
    border: 'border-role-researcher/40',
  },
  administrador: {
    soft: 'border-role-admin/30 bg-role-admin/10 text-role-admin',
    text: 'text-role-admin',
    solid: 'bg-role-admin text-role-admin-foreground',
    tint: 'bg-role-admin/10',
    border: 'border-role-admin/40',
  },
};
