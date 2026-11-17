/**
 * Traducciones legibles de los códigos de auditoría.
 *
 * El código almacenado tiene la forma `MODULO.ACCION`; se traduce la acción y el
 * módulo por separado para no inventar combinaciones que el backend no genera.
 * Un código desconocido se muestra tal cual.
 */
const ACCIONES: Record<string, string> = {
  SESSION_START: 'Sesión iniciada',
  SESSION_END: 'Sesión cerrada',
  LOGIN_FAILED: 'Intento de inicio de sesión fallido',
  ROLE_SWITCH: 'Cambió de rol activo',
  PATIENT_READ: 'Consultó pacientes',
  PATIENT_CREATE: 'Registró un paciente',
  RECORD_READ: 'Consultó una ficha clínica',
  CASE_CREATE: 'Creó un caso',
  CONSENT_CREATE: 'Registró un consentimiento',
  CONSENT_REVOKE: 'Revocó un consentimiento',
  DOCUMENT_READ: 'Consultó un documento',
  DOCUMENT_UPLOAD: 'Cargó un documento',
  IMAGE_READ: 'Consultó una imagen',
  IMAGE_UPLOAD: 'Cargó una imagen',
  INFERENCE_REQUEST: 'Solicitó una inferencia',
  INFERENCE_READ: 'Consultó una inferencia',
  REPORT_DOWNLOAD: 'Descargó un reporte',
  EXPORT: 'Exportó datos',
  USER_CREATE: 'Creó un usuario',
  USER_UPDATE: 'Modificó un usuario',
  USER_ROLE_CHANGE: 'Cambió los roles de un usuario',
  INSTITUTION_CREATE: 'Creó una institución',
  INSTITUTION_UPDATE: 'Modificó una institución',
  PERMISSION_CHANGE: 'Cambió los permisos de un rol',
  SETTINGS_CHANGE: 'Cambió los ajustes',
  ACCESS_DENIED: 'Acceso denegado',
  PII_REVEAL: 'Mostró datos personales',
  AUDIT_READ: 'Consultó la bitácora',
};

const MODULOS: Record<string, string> = {
  AUTH: 'Autenticación',
  PATIENTS: 'Pacientes',
  CLINICAL: 'Ficha clínica',
  FILES: 'Archivos',
  INFERENCE: 'Inferencia',
  ADMIN: 'Administración',
  AUDIT: 'Auditoría',
  EXPORT: 'Exportación',
};

export interface EtiquetaEvento {
  /** Texto comprensible; si el código es desconocido, el propio código. */
  titulo: string;
  /** Código original, siempre disponible. */
  codigo: string;
  /** Nombre del módulo cuando se reconoce. */
  modulo: string | null;
}

export function etiquetaEvento(codigo: string): EtiquetaEvento {
  const [modulo = '', ...resto] = codigo.split('.');
  const accion = resto.join('.') || modulo;
  const titulo = ACCIONES[accion];
  return {
    titulo: titulo ?? codigo,
    codigo,
    modulo: MODULOS[modulo] ?? null,
  };
}

/** Opciones del selector de eventos: las acciones conocidas, ordenadas por texto. */
export const OPCIONES_EVENTO = Object.entries(ACCIONES)
  .map(([accion, titulo]) => ({ accion, titulo }))
  .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

const CAMPOS: Record<string, string> = {
  role_code: 'Rol',
  resource_count: 'Recursos',
  motivo: 'Motivo',
  destino: 'Destino',
};

/** Resumen legible de los detalles: `role_code=admin` → «Rol: admin». */
export function resumenDetalles(detalles: Record<string, unknown> | null): string | null {
  if (!detalles) return null;
  const partes = Object.entries(detalles).map(
    ([clave, valor]) => `${CAMPOS[clave] ?? clave}: ${String(valor)}`,
  );
  return partes.length > 0 ? partes.join(' · ') : null;
}
