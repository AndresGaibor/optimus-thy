/** Milisegundos entre consultas del estado de un trabajo. */
export const INTERVALO_MS = 3000;

/** Tamaño máximo aceptado para una ecografía. */
export const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024;

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Fecha legible; si el valor no es una fecha válida, devuelve el original. */
export function fecha(iso: string): string {
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? iso : FORMATO_FECHA.format(valor);
}

/** Indica si el archivo es una imagen PNG o JPEG. */
export function esImagenAceptada(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return (
    archivo.type === 'image/png' ||
    archivo.type === 'image/jpeg' ||
    nombre.endsWith('.png') ||
    nombre.endsWith('.jpg') ||
    nombre.endsWith('.jpeg')
  );
}
