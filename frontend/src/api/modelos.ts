import { client } from './client';
import type { components } from './schema';

export type ModeloIA = components['schemas']['ModeloOut'];

export async function listarModelos(): Promise<ModeloIA[]> {
  const { data, error } = await client.GET('/modelos-ia');
  if (error || !data) throw new Error('No se pudieron cargar los modelos de IA.');
  return data;
}

export async function subirModelo(
  archivo: File,
  nombre: string,
  version: string,
): Promise<ModeloIA> {
  const body = new FormData();
  body.append('archivo', archivo);
  body.append('nombre', nombre);
  body.append('version', version);
  const { data, error } = await client.POST('/modelos-ia', {
    // openapi-typescript declara los campos multipart como texto.
    body: body as unknown as components['schemas']['Body_cargar_modelo_modelos_ia_post'],
  });
  if (error || !data) throw new Error('No se pudo subir el modelo de IA.');
  return data;
}

export async function activarModelo(id: string): Promise<ModeloIA> {
  const { data, error } = await client.POST('/modelos-ia/{id}/activar', {
    params: { path: { id } },
  });
  if (error || !data) throw new Error('No se pudo activar el modelo de IA.');
  return data;
}
