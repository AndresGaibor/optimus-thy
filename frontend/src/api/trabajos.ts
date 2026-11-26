import { client } from './client';

export type EstadoTrabajo = 'pendiente' | 'en_proceso' | 'completado' | 'error';

export interface Trabajo {
  id: string;
  tipo: string;
  estado: EstadoTrabajo;
  intentos: number;
  max_intentos: number;
  error_detalle?: string | null;
}

export async function encolarInferencia(imagenId: string): Promise<Trabajo> {
  const { data, error } = await client.POST('/trabajos', {
    body: { tipo: 'inferencia', payload: { imagen_id: imagenId } },
  });
  if (error || !data) throw new Error('No se pudo encolar la inferencia.');
  return data as unknown as Trabajo;
}

export async function consultarTrabajo(id: string): Promise<Trabajo> {
  const { data, error } = await client.GET('/trabajos/{id}', { params: { path: { id } } });
  if (error || !data) throw new Error('No se pudo consultar el trabajo.');
  return data as unknown as Trabajo;
}
