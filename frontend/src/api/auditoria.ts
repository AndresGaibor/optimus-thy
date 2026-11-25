import { API_URL, client } from './client';

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

/** Filtros comunes del listado y de la exportación. */
function consultaFiltros(filtros: FiltrosBitacora): Record<string, string> {
  const query: Record<string, string> = {};
  for (const clave of ['usuario', 'accion', 'desde', 'hasta', 'recurso'] as const) {
    const valor = filtros[clave];
    if (valor) query[clave] = valor;
  }
  return query;
}

/** Eventos de la bitácora de la institución (HU-020). */
export async function listarBitacora(
  filtros: FiltrosBitacora = {},
): Promise<{ total: number; items: EventoAuditoria[] }> {
  const query: Record<string, string | number> = consultaFiltros(filtros);
  if (typeof filtros.limite === 'number') query.limite = filtros.limite;
  if (typeof filtros.desplazamiento === 'number') query.desplazamiento = filtros.desplazamiento;

  const { data, error } = await client.GET('/auditoria', {
    params: { query: query as never },
  });
  if (error || !data) throw new Error('No se pudo cargar la bitácora.');
  return data as unknown as { total: number; items: EventoAuditoria[] };
}

/** Descarga la bitácora filtrada en CSV; la propia exportación queda registrada (HU-022). */
export async function exportarBitacora(filtros: FiltrosBitacora = {}): Promise<void> {
  const query = new URLSearchParams(consultaFiltros(filtros)).toString();
  const respuesta = await fetch(`${API_URL}/auditoria/exportar${query ? `?${query}` : ''}`, {
    credentials: 'include',
  });
  if (!respuesta.ok) throw new Error('No se pudo exportar la bitácora.');
  const disposicion = respuesta.headers.get('content-disposition') ?? '';
  const nombre = /filename="([^"]+)"/.exec(disposicion)?.[1] ?? 'bitacora.csv';
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
