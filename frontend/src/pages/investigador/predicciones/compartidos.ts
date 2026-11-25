import type { BadgeTone } from '../../../design-system/tones';
import type { PrediccionAuditada } from '../../../api/predicciones';

export interface FiltrosPredicciones {
  desde: string;
  hasta: string;
  resultado: string;
  decision: string;
  caso: string;
}

export const FILTROS_VACIOS: FiltrosPredicciones = {
  desde: '',
  hasta: '',
  resultado: '',
  decision: '',
  caso: '',
};

export const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

interface Etiqueta {
  texto: string;
  tono: BadgeTone;
}

export const RESULTADOS: Record<string, Etiqueta> = {
  benigno: { texto: 'Benigno', tono: 'success' },
  maligno: { texto: 'Maligno', tono: 'danger' },
  sin_nodulo: { texto: 'Normal (sin nódulo)', tono: 'neutral' },
};

export const DECISIONES: Record<string, string> = {
  acepta: 'Acepta el resultado',
  corrige: 'Corrige el resultado',
  descarta: 'Descarta el resultado',
};

export const DIFERENCIAS: Record<string, Etiqueta> = {
  coincide: { texto: 'Coincide', tono: 'success' },
  difiere: { texto: 'Difiere', tono: 'warning' },
  pendiente: { texto: 'Pendiente', tono: 'neutral' },
};

export const SIN_DATO = '—';

export function etiquetaResultado(resultado: string): Etiqueta {
  return RESULTADOS[resultado] ?? { texto: resultado, tono: 'neutral' };
}

export function etiquetaDiferencia(diferencia: string): Etiqueta {
  return DIFERENCIAS[diferencia] ?? { texto: diferencia, tono: 'neutral' };
}

export function referenciaDe(prediccion: PrediccionAuditada): string {
  if (!prediccion.referencia_clinica) return 'Sin referencia';
  return (
    DECISIONES[prediccion.referencia_clinica.decision] ?? prediccion.referencia_clinica.decision
  );
}

export function lanzadorDe(prediccion: PrediccionAuditada): string {
  if (!prediccion.lanzado_por) return SIN_DATO;
  const rol = prediccion.lanzado_por.rol ?? 'Sin rol';
  return `${rol} · ${prediccion.lanzado_por.id.slice(0, 8)}`;
}

/** Huella completa en el título; en la celda basta el prefijo para comparar. */
export function huellaCorta(hash: string): string {
  return hash.length > 16 ? `${hash.slice(0, 16)}…` : hash;
}

/** Cadenas que se envían al servidor, sin las claves vacías. */
export function consultaDe(filtros: FiltrosPredicciones) {
  return {
    ...(filtros.desde ? { desde: filtros.desde } : {}),
    ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    ...(filtros.resultado ? { resultado: filtros.resultado } : {}),
    ...(filtros.decision ? { decision: filtros.decision } : {}),
    ...(filtros.caso ? { caso: filtros.caso } : {}),
  };
}
