/** Reglas de RS-ACC-01 compartidas por el formulario y sus pruebas. */
export const MINIMO_PASSWORD = 12;

export interface ErroresPassword {
  actual?: string;
  nueva?: string;
  repeticion?: string;
}

/** Valida en el navegador antes de llamar a la API; el servidor repite la política. */
export function validarPassword(
  actual: string,
  nueva: string,
  repeticion: string,
): ErroresPassword {
  const errores: ErroresPassword = {};

  if (!actual.trim()) {
    errores.actual = 'Escribe tu contraseña actual.';
  }

  if (!nueva) {
    errores.nueva = 'Escribe una contraseña nueva.';
  } else if (nueva.length < MINIMO_PASSWORD) {
    errores.nueva = `Usa al menos ${MINIMO_PASSWORD} caracteres.`;
  } else if (nueva === actual) {
    errores.nueva = 'La contraseña nueva debe ser distinta de la actual.';
  }

  if (!repeticion) {
    errores.repeticion = 'Repite la contraseña nueva.';
  } else if (repeticion !== nueva) {
    errores.repeticion = 'Las contraseñas no coinciden.';
  }

  return errores;
}

export function tieneErrores(errores: ErroresPassword): boolean {
  return Boolean(errores.actual || errores.nueva || errores.repeticion);
}
