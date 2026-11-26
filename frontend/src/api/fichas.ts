import { client } from './client';

export interface EstadoFicha {
  caso_id: string;
  registrada: boolean;
  cerrada_en: string | null;
  cerrada_por_id: string | null;
  cerrada_por_nombre: string | null;
}

export interface VersionFicha {
  version: number;
  creado_en: string;
  autor_id: string | null;
  autor_nombre: string | null;
  campos_cambiados: string[];
  antes: Record<string, string | null> | null;
  despues: Record<string, string | null>;
}

export async function obtenerEstadoFicha(casoId: string): Promise<EstadoFicha> {
  const { data, error } = await client.GET('/casos/{caso_id}/ficha', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudo cargar el estado de la ficha.');
  return data as unknown as EstadoFicha;
}

export async function obtenerHistorialFicha(casoId: string): Promise<VersionFicha[]> {
  const { data, error } = await client.GET('/casos/{caso_id}/ficha/historial', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudo cargar el historial de la ficha.');
  return data.items as unknown as VersionFicha[];
}

export async function cerrarFicha(casoId: string): Promise<EstadoFicha> {
  const { data, error } = await client.POST('/casos/{caso_id}/ficha/cerrar', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudo cerrar la ficha.');
  return data as unknown as EstadoFicha;
}

export async function reabrirFicha(casoId: string): Promise<EstadoFicha> {
  const { data, error } = await client.POST('/casos/{caso_id}/ficha/reabrir', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudo reabrir la ficha.');
  return data as unknown as EstadoFicha;
}
