import { client } from './client';

export interface InstitucionAdmin {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
  usuarios_activos: number;
}

export interface CrearInstitucionDatos {
  nombre: string;
  codigo: string;
}

export interface ActualizarInstitucionCambios {
  nombre?: string;
  codigo?: string;
  activa?: boolean;
}

export type ApiErrorStatus = 401 | 403 | 404 | 409 | 422;

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; status: ApiErrorStatus; error?: unknown };

function esErrorStatus(status: number): status is ApiErrorStatus {
  return status === 401 || status === 403 || status === 404 || status === 409 || status === 422;
}

function fallo<T>(status: number | undefined, error: unknown): ApiResult<T> {
  return {
    ok: false,
    status: typeof status === 'number' && esErrorStatus(status) ? status : 422,
    error,
  };
}

export async function listarInstitucionesAdmin(): Promise<ApiResult<InstitucionAdmin[]>> {
  const { data, error, response } = await client.GET('/instituciones', {
    params: { query: { incluir_inactivas: true } },
  });
  if (error || !response?.ok) {
    return fallo(response?.status, error);
  }
  return { ok: true, data: (Array.isArray(data) ? data : []) as unknown as InstitucionAdmin[] };
}

export async function crearInstitucion(
  datos: CrearInstitucionDatos,
): Promise<ApiResult<InstitucionAdmin>> {
  const { data, error, response } = await client.POST('/instituciones', {
    body: { nombre: datos.nombre, codigo: datos.codigo },
  });
  if (error || !response?.ok) {
    return fallo(response?.status, error);
  }
  return { ok: true, data: data as unknown as InstitucionAdmin };
}

export async function actualizarInstitucion(
  id: string,
  cambios: ActualizarInstitucionCambios,
): Promise<ApiResult<InstitucionAdmin>> {
  const body: Record<string, unknown> = {};
  if (cambios.nombre !== undefined) body.nombre = cambios.nombre;
  if (cambios.codigo !== undefined) body.codigo = cambios.codigo;
  if (cambios.activa !== undefined) body.activa = cambios.activa;
  const { data, error, response } = await client.PATCH('/instituciones/{id}', {
    params: { path: { id } },
    body,
  });
  if (error || !response?.ok) {
    return fallo(response?.status, error);
  }
  return { ok: true, data: data as unknown as InstitucionAdmin };
}
