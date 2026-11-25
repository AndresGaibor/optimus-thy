import type { ResultadoGuardado } from '../../../api/resultados';
import type { BadgeTone } from '../../../design-system/tones';
import { FORMATO_FECHA } from '../conclusion/compartidos';

/** Relación entre las salidas de los modelos que analizaron una misma imagen. */
export type Veredicto = 'coinciden' | 'difieren' | 'sin_comparacion';

/** Filtro visible de la pantalla; `todas` conserva también las imágenes sin comparación. */
export type FiltroVeredicto = 'todas' | 'difieren' | 'coinciden';

export interface FilaModelo {
  id: string;
  modelo: { nombre: string; version: string };
  resultado: string;
  confianza: number | null;
  probabilidadBenigno: number | null;
  probabilidadMaligno: number | null;
  nodulos: number;
  creadoEn: string;
}

export interface GrupoImagen {
  imagenId: string;
  casoId: string;
  casoCodigo: string;
  pacienteCodigo: string;
  creadoEn: string;
  filas: FilaModelo[];
  /** Versiones de modelo distintas que analizaron la imagen. */
  modelos: number;
  veredicto: Veredicto;
}

export interface ResumenComparacion {
  imagenes: number;
  comparables: number;
  coincidencias: number;
  discrepancias: number;
  sinComparacion: number;
}

export const VEREDICTOS: Record<Veredicto, { texto: string; tono: BadgeTone; detalle: string }> = {
  coinciden: {
    texto: 'Coinciden',
    tono: 'success',
    detalle: 'Todos los modelos asignan la misma clase a la imagen.',
  },
  difieren: {
    texto: 'Difieren',
    tono: 'warning',
    detalle: 'Los modelos asignan clases distintas a la misma imagen.',
  },
  sin_comparacion: {
    texto: 'Sin comparación',
    tono: 'neutral',
    detalle: 'Solo hay una inferencia para esta imagen; no hay otro modelo con el que comparar.',
  },
};

const PESO: Record<Veredicto, number> = {
  difieren: 0,
  coinciden: 1,
  sin_comparacion: 2,
};

/** Formatea una probabilidad o confianza como porcentaje; `null` se muestra como raya. */
export function porcentaje(valor: number | null): string {
  return valor === null ? '—' : `${(valor * 100).toFixed(1)} %`;
}

export function fechaComparacion(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}

/** Máximo de los valores presentes; `null` cuando no hay ninguno. */
function maximo(valores: Array<number | null>): number | null {
  let resultado: number | null = null;
  for (const valor of valores) {
    if (valor === null) continue;
    if (resultado === null || valor > resultado) resultado = valor;
  }
  return resultado;
}

function filaDeResultado(resultado: ResultadoGuardado): FilaModelo {
  return {
    id: resultado.id,
    modelo: resultado.modelo,
    resultado: resultado.resultado,
    confianza: resultado.confianza,
    probabilidadBenigno: maximo(resultado.nodulos.map((nodulo) => nodulo.probabilidad_benigno)),
    probabilidadMaligno: maximo(resultado.nodulos.map((nodulo) => nodulo.probabilidad_maligno)),
    nodulos: resultado.nodulos.length,
    creadoEn: resultado.creado_en,
  };
}

/**
 * Agrupa las inferencias por imagen y decide si los modelos coinciden.
 *
 * Solo cuenta como comparación cuando la imagen tiene inferencias de al menos
 * dos versiones de modelo distintas; dos corridas del mismo modelo no comparan
 * nada nuevo.
 */
export function agruparPorImagen(resultados: ResultadoGuardado[]): GrupoImagen[] {
  const porImagen = new Map<string, ResultadoGuardado[]>();
  for (const resultado of resultados) {
    const lista = porImagen.get(resultado.imagen_id);
    if (lista) lista.push(resultado);
    else porImagen.set(resultado.imagen_id, [resultado]);
  }

  const grupos = [...porImagen.entries()].map(([imagenId, items]) => {
    const filas = items
      .map(filaDeResultado)
      .sort(
        (a, b) =>
          a.modelo.nombre.localeCompare(b.modelo.nombre) ||
          a.modelo.version.localeCompare(b.modelo.version),
      );
    const modelos = new Set(items.map((item) => `${item.modelo.id}@${item.modelo.version}`)).size;
    const clases = new Set(items.map((item) => item.resultado));
    const veredicto: Veredicto =
      modelos < 2 ? 'sin_comparacion' : clases.size === 1 ? 'coinciden' : 'difieren';
    const masReciente = items.reduce((anterior, actual) =>
      actual.creado_en > anterior.creado_en ? actual : anterior,
    );
    return {
      imagenId,
      casoId: masReciente.caso_id,
      casoCodigo: masReciente.caso_codigo,
      pacienteCodigo: masReciente.paciente_codigo,
      creadoEn: masReciente.creado_en,
      filas,
      modelos,
      veredicto,
    };
  });

  return grupos.sort(
    (a, b) => PESO[a.veredicto] - PESO[b.veredicto] || b.creadoEn.localeCompare(a.creadoEn),
  );
}

export function resumirComparacion(grupos: GrupoImagen[]): ResumenComparacion {
  return {
    imagenes: grupos.length,
    comparables: grupos.filter((grupo) => grupo.modelos > 1).length,
    coincidencias: grupos.filter((grupo) => grupo.veredicto === 'coinciden').length,
    discrepancias: grupos.filter((grupo) => grupo.veredicto === 'difieren').length,
    sinComparacion: grupos.filter((grupo) => grupo.veredicto === 'sin_comparacion').length,
  };
}

export function filtrarGrupos(grupos: GrupoImagen[], filtro: FiltroVeredicto): GrupoImagen[] {
  return filtro === 'todas' ? grupos : grupos.filter((grupo) => grupo.veredicto === filtro);
}
