import { NOTA_MINIMA, type CategoriaConclusion, type Errores } from './compartidos';

/** Errores de la conclusión antes de enviarla; vacío si es válida. */
export function validarConclusion(categoria: CategoriaConclusion | '', nota: string): Errores {
  const errores: Errores = {};
  if (!categoria) {
    errores.categoria = 'Selecciona una categoría para tu conclusión.';
  }
  const limpia = nota.trim();
  if (!limpia) {
    errores.nota = 'Escribe una nota con tu criterio.';
  } else if (limpia.length < NOTA_MINIMA) {
    errores.nota = `La nota debe tener al menos ${NOTA_MINIMA} caracteres.`;
  }
  return errores;
}
