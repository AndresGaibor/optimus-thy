import { client } from './client';
import type { ApiResult } from './usuarios';

export interface Permiso {
  codigo: string;
  descripcion: string | null;
}

export interface RolMatriz {
  id: string;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
  asignables: string[];
}

export interface MatrizRoles {
  roles: RolMatriz[];
  permisos: Permiso[];
}

/** Estado deseado y estado del que partió el cliente, por rol. */
export interface MatrizPermisosPayload {
  estado: Record<string, string[]>;
  esperado: Record<string, string[]>;
}

function esErrorStatus(status: number): status is 401 | 403 | 404 | 409 | 422 {
  return status === 401 || status === 403 || status === 404 || status === 409 || status === 422;
}

export async function obtenerMatriz(): Promise<ApiResult<MatrizRoles>> {
  const { data, error, response } = await client.GET('/roles');
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as MatrizRoles };
}

export async function guardarMatriz(
  payload: MatrizPermisosPayload,
): Promise<ApiResult<MatrizRoles>> {
  const { data, error, response } = await client.PUT('/roles/permisos', { body: payload });
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as MatrizRoles };
}
