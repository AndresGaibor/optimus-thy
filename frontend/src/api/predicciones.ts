import { API_URL } from './client';

export interface AutorPrediccion {
  id: string;
  rol: string | null;
}

export interface PrediccionAuditada {
  id: string;
  creado_en: string;
  caso_id: string;
  caso_codigo: string;
  paciente_codigo: string;
  imagen: { id: string; hash_sha256: string };
  modelo: { id: string; nombre: string; version: string; hash_pesos: string };
  resultado: string;
  confianza: number | null;
  lanzado_por: AutorPrediccion | null;
  referencia_clinica: { decision: string; creado_en: string } | null;
  diferencia: string;
}

export interface FiltrosPredicciones {
  desde?: string;
  hasta?: string;
  resultado?: string;
  decision?: string;
  caso?: string;
  modelo?: string;
  limite?: number;
  desplazamiento?: number;
}

export interface PrediccionesAuditadas {
  total: number;
  items: PrediccionAuditada[];
}

/** Predicciones auditables de la institución (HU-093); filtros en el servidor. */
export async function listarPrediccionesAuditadas(
  filtros: FiltrosPredicciones = {},
): Promise<PrediccionesAuditadas> {
  const query = new URLSearchParams();
  for (const clave of ['desde', 'hasta', 'resultado', 'decision', 'caso', 'modelo'] as const) {
    const valor = filtros[clave];
    if (valor) query.set(clave, valor);
  }
  if (typeof filtros.limite === 'number') query.set('limite', String(filtros.limite));
  if (typeof filtros.desplazamiento === 'number') {
    query.set('desplazamiento', String(filtros.desplazamiento));
  }

  const cadena = query.toString();
  const respuesta = await fetch(
    `${API_URL}/investigacion/predicciones${cadena ? `?${cadena}` : ''}`,
    { credentials: 'include' },
  );
  if (!respuesta.ok) throw new Error('No se pudieron cargar las predicciones.');
  return (await respuesta.json()) as PrediccionesAuditadas;
}
