import { API_URL, client } from './client';
import type { components } from './schema';

export type MetricasModelo = components['schemas']['MetricasModeloOut'];
export type ModeloMetricas = MetricasModelo['modelo'];

export interface FiltrosMetricas {
  desde?: string;
  hasta?: string;
  modelo?: string;
  cohorte_id?: string;
}

const ERROR_METRICAS = 'No se pudieron cargar las métricas. Reintenta la operación.';

/** Agregados de acuerdo con la decisión médica de la institución investigadora. */
export async function listarMetricas(filtros: FiltrosMetricas = {}): Promise<MetricasModelo[]> {
  const query = {
    ...(filtros.desde ? { desde: filtros.desde } : {}),
    ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    ...(filtros.modelo ? { modelo: filtros.modelo } : {}),
  };
  try {
    if (filtros.cohorte_id) {
      const parametros = new URLSearchParams(query);
      parametros.set('cohorte_id', filtros.cohorte_id);
      const respuesta = await fetch(`${API_URL}/investigacion/metricas?${parametros.toString()}`);
      if (!respuesta.ok) throw new Error(ERROR_METRICAS);
      const datos: unknown = await respuesta.json();
      if (!Array.isArray(datos)) throw new Error(ERROR_METRICAS);
      return datos;
    }
    const { data, error } = await client.GET('/investigacion/metricas', {
      params: { query },
    });
    if (error || !data) throw new Error(ERROR_METRICAS);
    return data;
  } catch {
    throw new Error(ERROR_METRICAS);
  }
}
