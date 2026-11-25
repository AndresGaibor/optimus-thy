import type { DecisionRegistrada } from '../../../api/decisiones';

export type CategoriaConclusion = 'acepta' | 'corrige' | 'descarta';
export type Paso = 'consulta' | 'formulario' | 'confirmacion' | 'lectura';

export interface ResultadoInferencia {
  texto: string;
  tono: 'success' | 'danger' | 'neutral';
}

export const CATEGORIAS: Array<{ valor: CategoriaConclusion; etiqueta: string }> = [
  { valor: 'acepta', etiqueta: 'Acepto el resultado' },
  { valor: 'corrige', etiqueta: 'Corrijo el resultado' },
  { valor: 'descarta', etiqueta: 'Descarto el resultado' },
];

export const RESULTADOS: Record<string, ResultadoInferencia> = {
  benigno: { texto: 'Benigno', tono: 'success' },
  maligno: { texto: 'Maligno', tono: 'danger' },
  sin_nodulo: { texto: 'Normal (sin nódulo)', tono: 'neutral' },
};

export const SIN_CLASIFICAR = { texto: 'Sin clasificar', tono: 'neutral' as const };

export const NOTA_MINIMA = 10;
export const NOTA_MAXIMA = 2000;
export const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Datos de la inferencia que la conclusión toma solo como referencia. */
export interface InferenciaResumen {
  id: string;
  caso_id: string;
  resultado: string;
  confianza: number | null;
  creado_en: string;
  modelo: { nombre: string; version: string };
  /** Presente si la consulta de resultados ya incluye la decisión registrada. */
  decision?: DecisionRegistrada;
}

export interface Errores {
  categoria?: string;
  nota?: string;
}
