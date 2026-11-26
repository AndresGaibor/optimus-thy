import { API_URL, client } from './client';
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

/** Formatos que admite el archivo exportado. */
export type FormatoExportacion = 'csv' | 'json';

/** Archivo listo para descargar: nombre sugerido y contenido. */
export interface DescargaDataset {
  nombre: string;
  contenido: Blob;
}

const ERROR_EXPORTACION = 'No se pudo exportar el dataset. Reintenta la operación.';

function nombreDesdeCabecera(cabecera: string | null, respaldo: string): string {
  const coincidencia = cabecera?.match(/filename="?([^";]+)"?/i);
  return coincidencia?.[1] ?? respaldo;
}

/**
 * Descarga el dataset con su ficha técnica (RF-INV-08).
 *
 * Devuelve el archivo como `Blob` para que el componente decida cuándo
 * descargarlo; la bitácora registra la exportación en el servidor.
 */
export async function exportarDataset(
  id: string,
  formato: FormatoExportacion,
): Promise<Resultado<DescargaDataset>> {
  try {
    const respuesta = await fetch(
      `${API_URL}/investigacion/datasets/${encodeURIComponent(id)}/exportar?formato=${formato}`,
    );
    if (!respuesta.ok) {
      if (respuesta.status === 404) {
        return { ok: false, error: 'El dataset ya no está disponible.' };
      }
      if (respuesta.status === 403) {
        return { ok: false, error: 'Tu rol no permite exportar datasets.' };
      }
      return { ok: false, error: ERROR_EXPORTACION };
    }
    return {
      ok: true,
      data: {
        nombre: nombreDesdeCabecera(
          respuesta.headers.get('content-disposition'),
          `dataset.${formato}`,
        ),
        contenido: await respuesta.blob(),
      },
    };
  } catch {
    return { ok: false, error: ERROR_EXPORTACION };
  }
}
