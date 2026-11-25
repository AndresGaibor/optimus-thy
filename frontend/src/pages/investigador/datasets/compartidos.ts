import type { CasoAnonimizado } from '../../../api/datasets';

export const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export const SIN_DATO = '—';

/** Huella completa en el título; en la tarjeta basta el prefijo para comparar. */
export function huellaCorta(huella: string): string {
  return huella.length > 16 ? `${huella.slice(0, 16)}…` : huella;
}

/** Valor de texto o guion cuando el dataset no publica el campo. */
export function texto(valor: string | null): string {
  return valor ?? SIN_DATO;
}

/** Medida anonimizada con su unidad, o guion cuando no aplica. */
export function medida(valor: number | null, unidad: string | null): string {
  if (valor === null) return SIN_DATO;
  return unidad ? `${valor} ${unidad}` : String(valor);
}

/** Orden estable de las columnas de la tabla de filas anonimizadas. */
export const COLUMNAS_CASO: Array<{
  clave: keyof CasoAnonimizado;
  titulo: string;
}> = [
  { clave: 'sujeto', titulo: 'Sujeto' },
  { clave: 'edad_rango', titulo: 'Edad' },
  { clave: 'mes_caso', titulo: 'Mes del caso' },
  { clave: 'tsh', titulo: 'TSH' },
  { clave: 't3', titulo: 'T3' },
  { clave: 't4', titulo: 'T4' },
  { clave: 'tamano_nodulo_mm', titulo: 'Nódulo (mm)' },
  { clave: 'lateralidad', titulo: 'Lateralidad' },
  { clave: 'tirads', titulo: 'TI-RADS' },
  { clave: 'bethesda', titulo: 'Bethesda' },
  { clave: 'cie10', titulo: 'CIE-10' },
  { clave: 'tipo_diagnostico', titulo: 'Diagnóstico' },
  { clave: 'tipo_consulta', titulo: 'Consulta' },
];

/** Texto de una celda según el tipo de campo anonimizado. */
export function valorCaso(fila: CasoAnonimizado, clave: keyof CasoAnonimizado): string {
  switch (clave) {
    case 'tsh':
      return medida(fila.tsh, fila.tsh_unidad);
    case 't3':
      return medida(fila.t3, fila.t3_unidad);
    case 't4':
      return medida(fila.t4, fila.t4_unidad);
    case 'tamano_nodulo_mm':
      return fila.tamano_nodulo_mm === null ? SIN_DATO : String(fila.tamano_nodulo_mm);
    default: {
      const valor = fila[clave];
      return typeof valor === 'string' ? texto(valor) : SIN_DATO;
    }
  }
}
