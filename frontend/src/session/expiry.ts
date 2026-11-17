/** Segundos de aviso antes de que la sesión expire por inactividad (HU-005). */
export const AVISO_SEGUNDOS = 60;

/** Margen mínimo entre renovaciones disparadas por actividad del usuario. */
export const RENOVAR_CADA_MS = 60_000;

/** Instante de expiración a partir de los segundos que informa el backend. */
export function instanteDeExpiracion(
  segundos: number | null | undefined,
  ahora = Date.now(),
): number | null {
  return typeof segundos === 'number' && Number.isFinite(segundos) ? ahora + segundos * 1000 : null;
}

/** ¿Queda menos que el aviso y la sesión todavía no expiró? */
export function sesionPorExpirar(expiraEn: number | null, ahora = Date.now()): boolean {
  if (expiraEn === null) return false;
  const restante = expiraEn - ahora;
  return restante > 0 && restante <= AVISO_SEGUNDOS * 1000;
}
