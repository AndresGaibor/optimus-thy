import { client } from './client';
import type { components } from './schema';

export type DatasetResumen = components['schemas']['DatasetResumenOut'];
export type CasoAnonimizado = components['schemas']['CasoAnonimizadoOut'];
export type Dataset = components['schemas']['DatasetOut'];
export type ListaDatasets = components['schemas']['DatasetsListOut'];

/** Resultado con éxito o un mensaje listo para mostrar en la interfaz. */
export type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_LISTA = 'No se pudieron cargar los datasets. Reintenta la operación.';
const ERROR_DETALLE = 'No se pudo abrir el dataset. Reintenta la operación.';

/** Metadatos de los datasets anonimizados de la institución (HU-090). */
export async function listarDatasets(): Promise<Resultado<ListaDatasets>> {
  try {
    const { data, error } = await client.GET('/investigacion/datasets');
    if (error || !data) return { ok: false, error: ERROR_LISTA };
    return { ok: true, data };
  } catch {
    return { ok: false, error: ERROR_LISTA };
  }
}

/** Filas anonimizadas de un dataset; un conjunto ajeno responde 404. */
export async function obtenerDataset(id: string): Promise<Resultado<Dataset>> {
  try {
    const { data, response } = await client.GET('/investigacion/datasets/{id}', {
      params: { path: { id } },
    });
    if (data) return { ok: true, data };
    if (response.status === 404) {
      return { ok: false, error: 'El dataset ya no está disponible.' };
    }
    return { ok: false, error: ERROR_DETALLE };
  } catch {
    return { ok: false, error: ERROR_DETALLE };
  }
}
