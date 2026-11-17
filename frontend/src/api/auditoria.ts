import { client } from './client';

export const RECURSOS_AUDITORIA = [
  'PATIENT',
  'CASE',
  'RECORD',
  'DOCUMENT',
  'IMAGE',
  'INFERENCE',
  'CONSENT',
  'USER',
  'ROLE',
  'SYSTEM',
  'DATASET',
  'REPORT',
  'AUDIT',
] as const;

export interface EventoAuditoria {
  id: number;
  ocurrido_en: string;
  usuario_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  direccion_ip: string | null;
  detalles: Record<string, unknown> | null;
}

export interface FiltrosBitacora {
  usuario?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
  recurso?: string;
  limite?: number;
  desplazamiento?: number;
}

/** Eventos de la bitácora de la institución (HU-020). */
export async function listarBitacora(
  filtros: FiltrosBitacora = {},
): Promise<{ total: number; items: EventoAuditoria[] }> {
  const query: Record<string, string | number> = {};
  for (const clave of ['usuario', 'accion', 'desde', 'hasta', 'recurso'] as const) {
    const valor = filtros[clave];
    if (valor) query[clave] = valor;
  }
  if (typeof filtros.limite === 'number') query.limite = filtros.limite;
  if (typeof filtros.desplazamiento === 'number') query.desplazamiento = filtros.desplazamiento;

  const { data, error } = await client.GET('/auditoria', {
    params: { query: query as never },
  });
  if (error || !data) throw new Error('No se pudo cargar la bitácora.');
  return data as unknown as { total: number; items: EventoAuditoria[] };
}
