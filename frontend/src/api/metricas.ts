import { client } from './client';
import type { components } from './schema';

export type MetricasModelo = components['schemas']['MetricasModeloOut'];
export type ModeloMetricas = MetricasModelo['modelo'];

export interface FiltrosMetricas {
  desde?: string;
  hasta?: string;
  modelo?: string;
}

const ERROR_METRICAS = 'No se pudieron cargar las métricas. Reintenta la operación.';

/** Agregados de acuerdo con la decisión médica de la institución investigadora. */
export async function listarMetricas(
  filtros: FiltrosMetricas = {},
): Promise<MetricasModelo[]> {
  const query = {
    ...(filtros.desde ? { desde: filtros.desde } : {}),
    ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    ...(filtros.modelo ? { modelo: filtros.modelo } : {}),
  };
  try {
    const { data, error } = await client.GET('/investigacion/metricas', {
      params: { query },
    });
    if (error || !data) throw new Error(ERROR_METRICAS);
    return data;
  } catch {
    throw new Error(ERROR_METRICAS);
  }
}
