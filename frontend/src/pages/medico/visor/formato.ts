import type { ImagenCaso } from '../../../api/imagenes';

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

/** Fecha legible de la captura; nunca lanza con un valor inválido. */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : FORMATO_FECHA.format(fecha);
}

/** Dimensiones legibles; `No disponible` si el listado no las incluye. */
export function formatearDimensiones(ancho: number, alto: number): string {
  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho <= 0 || alto <= 0) {
    return 'No disponible';
  }
  return `${ancho} × ${alto} px`;
}

/** Tamaño legible en kB o MB, con coma decimal. */
export function formatearBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'No disponible';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

/** Vigencia del enlace firmado, en minutos o segundos. */
export function formatearVigencia(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos <= 0) return 'sin vigencia';
  if (segundos < 60) return `${Math.round(segundos)} s`;
  return `${Math.round(segundos / 60)} min`;
}

/** Nombre sugerido para descargar la copia saneada. */
export function nombreDescarga(imagen: ImagenCaso): string {
  return `ecografia-${imagen.id.slice(0, 8)}.${imagen.formato.toLowerCase()}`;
}
