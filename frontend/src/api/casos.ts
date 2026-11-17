import { client } from './client';

export interface CasoDetalle {
  id: string;
  codigo: string;
  paciente_id: string;
  paciente_codigo: string;
  creado_en: string;
  tiene_ficha: boolean;
  documentos: number;
  imagenes: number;
  consentimientos: number;
}

/** Datos del caso; el backend responde sin esquema OpenAPI, de ahí el cast. */
export async function obtenerCaso(id: string): Promise<CasoDetalle> {
  const { data, error } = await client.GET('/casos/{id}', { params: { path: { id } } });
  if (error || !data) throw new Error('No se pudo cargar el caso.');
  return data as unknown as CasoDetalle;
}
