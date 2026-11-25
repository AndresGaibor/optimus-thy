import type { Inferencia, ResultadoGuardado } from '../../../api/resultados';
import { FORMATO_FECHA, RESULTADOS, SIN_CLASIFICAR } from '../conclusion/compartidos';

/** Elementos por página; coincide con el máximo razonable del historial. */
export const LIMITE_POR_PAGINA = 20;

export interface FilaHistorial {
  id: string;
  creado_en: string;
  imagen_id: string;
  resultado: string;
  confianza: number | null;
  modelo: { nombre: string; version: string };
  caso_id: string;
  caso_codigo: string | null;
  paciente_codigo: string | null;
}

/** Normaliza una inferencia de un caso al modelo de fila del historial. */
export function filaDeInferencia(inferencia: Inferencia, casoId: string): FilaHistorial {
  return {
    id: inferencia.id,
    creado_en: inferencia.creado_en,
    imagen_id: inferencia.imagen_id,
    resultado: inferencia.resultado,
    confianza: inferencia.confianza,
    modelo: inferencia.modelo,
    caso_id: casoId,
    caso_codigo: null,
    paciente_codigo: null,
  };
}

/** Normaliza un resultado institucional, que ya trae el caso y el paciente. */
export function filaDeResultado(resultado: ResultadoGuardado): FilaHistorial {
  return {
    id: resultado.id,
    creado_en: resultado.creado_en,
    imagen_id: resultado.imagen_id,
    resultado: resultado.resultado,
    confianza: resultado.confianza,
    modelo: resultado.modelo,
    caso_id: resultado.caso_id,
    caso_codigo: resultado.caso_codigo,
    paciente_codigo: resultado.paciente_codigo,
  };
}

export function etiquetaResultado(resultado: string): {
  texto: string;
  tono: 'success' | 'danger' | 'neutral';
} {
  return RESULTADOS[resultado] ?? SIN_CLASIFICAR;
}

export function formatearFecha(fechaIso: string): string {
  return FORMATO_FECHA.format(new Date(fechaIso));
}

export function formatearConfianza(valor: number | null): string {
  return valor === null ? '—' : `${(valor * 100).toFixed(1)} %`;
}
