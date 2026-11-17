/** Extrae el mensaje del servidor cuando la API devuelve `{ error: { message } }`. */
export function mensajeDelServidor(error: unknown): string | null {
  let cuerpo: unknown = error;
  if (typeof cuerpo === 'string') {
    try {
      cuerpo = JSON.parse(cuerpo);
    } catch {
      return null;
    }
  }
  if (!cuerpo || typeof cuerpo !== 'object' || !('error' in cuerpo)) return null;
  const detalle = cuerpo.error;
  if (!detalle || typeof detalle !== 'object' || !('message' in detalle)) return null;
  const mensaje = detalle.message;
  return typeof mensaje === 'string' && mensaje.trim() !== '' ? mensaje : null;
}
