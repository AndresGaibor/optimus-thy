/** Formato de fecha local para tablas clínicas; si la fecha no es válida se muestra tal cual. */
export function formatearFecha(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-EC').format(fecha);
  } catch {
    return fechaIso;
  }
}
