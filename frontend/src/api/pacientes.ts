import { client } from './client';

export interface Paciente {
  id: string;
  codigo: string;
  creado_en: string;
  total_casos: number;
}

function esPaciente(valor: unknown): valor is Paciente {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const v = valor as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.codigo === 'string' &&
    typeof v.creado_en === 'string' &&
    typeof v.total_casos === 'number'
  );
}

export interface ListaPacientes {
  total: number;
  items: Paciente[];
}

export type ApiErrorStatus = 401 | 403 | 404 | 409 | 422;

export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; status: ApiErrorStatus; error?: unknown };

function esErrorStatus(status: number): status is ApiErrorStatus {
  return status === 401 || status === 403 || status === 404 || status === 409 || status === 422;
}

export async function listarPacientes(params?: {
  q?: string;
  limite?: number;
  desplazamiento?: number;
}): Promise<ApiResult<ListaPacientes>> {
  const query: Record<string, string | number> = {};
  if (params?.q && params.q.trim() !== '') {
    query.q = params.q.trim();
  }
  if (typeof params?.limite === 'number') {
    query.limite = params.limite;
  }
  if (typeof params?.desplazamiento === 'number') {
    query.desplazamiento = params.desplazamiento;
  }

  const { data, error, response } = await client.GET('/pacientes', {
    params: {
      query,
    },
  });

  if (data) {
    return { ok: true, data };
  }

  if (error !== undefined && response) {
    const status = response.status;
    if (esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }

  if (response) {
    const status = response.status;
    if (esErrorStatus(status)) {
      return { ok: false, status };
    }
    return { ok: false, status: 422 };
  }

  return { ok: false, status: 422 };
}

export async function crearPaciente(datos: {
  nombres: string;
  apellidos: string;
  documento: string;
  fecha_nacimiento: string;
}): Promise<ApiResult<Paciente>> {
  const { data, error, response } = await client.POST('/pacientes', {
    body: datos,
  });

  if (data) {
    return { ok: true, data };
  }

  if (error !== undefined && response) {
    const status = response.status;
    if (esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }

  if (response) {
    const status = response.status;
    if (esErrorStatus(status)) {
      return { ok: false, status };
    }
    return { ok: false, status: 422 };
  }

  return { ok: false, status: 422 };
}

export async function obtenerPaciente(id: string): Promise<ApiResult<Paciente>> {
  const { data, error, response } = await client.GET('/pacientes/{id}', {
    params: {
      path: { id },
    },
  });

  if (data) {
    if (esPaciente(data)) {
      return { ok: true, data };
    }
    return { ok: false, status: 422 };
  }

  if (error !== undefined && response) {
    const status = response.status;
    if (esErrorStatus(status)) {
      return { ok: false, status, error };
    }
    return { ok: false, status: 422, error };
  }

  if (response) {
    const status = response.status;
    if (esErrorStatus(status)) {
      return { ok: false, status };
    }
    return { ok: false, status: 422 };
  }

  return { ok: false, status: 422 };
}
