import { client } from './client';

export interface Institucion {
  id: string;
  nombre: string;
}

export interface UsuarioInstitucion {
  id: string;
  nombre: string;
}

export interface Usuario {
  id: string;
  correo: string;
  nombre: string | null;
  activo: boolean;
  institucion: UsuarioInstitucion;
  roles: string[];
}

export interface ListaUsuariosRespuesta {
  total: number;
  items: Usuario[];
}

export interface ListarUsuariosParams {
  q?: string | null;
  institucionId?: string | null;
  activo?: boolean | null;
  limite?: number;
  desplazamiento?: number;
}

export interface CrearUsuarioDatos {
  correo: string;
  nombre?: string | null;
  institucionId: string;
  roles: string[];
  password: string;
}

export interface ActualizarUsuarioCambios {
  nombre?: string | null;
  activo?: boolean | null;
  institucionId?: string | null;
}

export type ApiErrorStatus = 401 | 403 | 404 | 409 | 422;

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; status: ApiErrorStatus; error?: unknown };

function esErrorStatus(status: number): status is ApiErrorStatus {
  return status === 401 || status === 403 || status === 404 || status === 409 || status === 422;
}

export async function listarInstituciones(): Promise<ApiResult<Institucion[]>> {
  const { data, error, response } = await client.GET('/instituciones');
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as Institucion[] };
}

export async function listarUsuarios(
  params: ListarUsuariosParams = {},
): Promise<ApiResult<ListaUsuariosRespuesta>> {
  const query: Record<string, string | number | boolean> = {};
  if (params.institucionId !== undefined && params.institucionId !== null) {
    query.institucion_id = params.institucionId;
  }
  if (params.activo !== undefined && params.activo !== null) {
    query.activo = params.activo;
  }
  if (params.q !== undefined && params.q !== null && params.q !== '') {
    query.q = params.q;
  }
  if (params.limite !== undefined && params.limite !== null) {
    query.limite = params.limite;
  }
  if (params.desplazamiento !== undefined && params.desplazamiento !== null) {
    query.desplazamiento = params.desplazamiento;
  }

  const { data, error, response } = await client.GET('/usuarios', {
    params: {
      query,
    },
  });
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as ListaUsuariosRespuesta };
}

export async function crearUsuario(datos: CrearUsuarioDatos): Promise<ApiResult<Usuario>> {
  const body = {
    correo: datos.correo,
    ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
    institucion_id: datos.institucionId,
    roles: datos.roles,
    password: datos.password,
  };
  const { data, error, response } = await client.POST('/usuarios', {
    body,
  });
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as Usuario };
}

export async function actualizarUsuario(
  id: string,
  cambios: ActualizarUsuarioCambios,
): Promise<ApiResult<Usuario>> {
  const body: Record<string, unknown> = {};
  if (cambios.nombre !== undefined) {
    body.nombre = cambios.nombre;
  }
  if (cambios.activo !== undefined) {
    body.activo = cambios.activo;
  }
  if (cambios.institucionId !== undefined) {
    body.institucion_id = cambios.institucionId;
  }
  const { data, error, response } = await client.PATCH('/usuarios/{id}', {
    params: {
      path: { id },
    },
    body,
  });
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as Usuario };
}

export async function reemplazarRoles(id: string, roles: string[]): Promise<ApiResult<Usuario>> {
  const { data, error, response } = await client.PUT('/usuarios/{id}/roles', {
    params: {
      path: { id },
    },
    body: { roles },
  });
  if (error || !response?.ok) {
    const status = response?.status;
    if (typeof status === 'number' && esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }
  return { ok: true, data: data as unknown as Usuario };
}
