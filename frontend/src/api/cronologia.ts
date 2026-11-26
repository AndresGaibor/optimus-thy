import { client } from './client';

export type TipoHitoCronologia =
  'imagen' | 'inferencia' | 'consentimiento' | 'decision' | 'ficha' | 'cambio_ficha';

export interface HitoCronologia {
  tipo: TipoHitoCronologia;
  ocurrido_en: string;
  titulo: string;
  detalle: string | null;
  actor: string | null;
}

export async function obtenerCronologia(casoId: string): Promise<HitoCronologia[]> {
  const { data, error } = await client.GET('/casos/{caso_id}/cronologia', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudo cargar la cronología.');
  return (data as unknown as { items: HitoCronologia[] }).items;
}
