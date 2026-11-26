import { client } from './client';

export interface Paciente {
  id: string;
  codigo: string;
  creado_en: string;
  total_casos: number;
  archivado_en?: string | null;
}

/** Caso asociado al paciente en el detalle (`GET /pacientes/{id}`). */
export interface CasoResumen {
  id: string;
  codigo: string;
  paciente_id: string;
  paciente_codigo: string;
  creado_en: string;
}

/** Paciente con sus casos; el listado no los incluye, el detalle sí. */
export interface PacienteDetalle extends Paciente {
  casos: CasoResumen[];
}

/** El alta responde 409 con `error.code = "posible_duplicado"` cuando el documento ya existe. */
export function esDocumentoDuplicado(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const detalle = (error as Record<string, unknown>).error;
  if (!detalle || typeof detalle !== 'object') {
    return false;
  }
  return (detalle as Record<string, unknown>).code === 'posible_duplicado';
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
    typeof v.total_casos === 'number' &&
    (v.archivado_en === undefined || v.archivado_en === null || typeof v.archivado_en === 'string')
  );
}

function esPacienteDetalle(valor: unknown): valor is PacienteDetalle {
  return esPaciente(valor) && 'casos' in valor && Array.isArray(valor.casos);
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
  incluir_archivados?: boolean;
}): Promise<ApiResult<ListaPacientes>> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.q && params.q.trim() !== '') {
    query.q = params.q.trim();
  }
  if (typeof params?.limite === 'number') {
    query.limite = params.limite;
  }
  if (typeof params?.desplazamiento === 'number') {
    query.desplazamiento = params.desplazamiento;
  }
  if (typeof params?.incluir_archivados === 'boolean') {
    query.incluir_archivados = params.incluir_archivados;
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

export async function crearPaciente(
  datos: {
    nombres: string;
    apellidos: string;
    documento: string;
    fecha_nacimiento: string;
  },
  confirmarDuplicado = false,
): Promise<ApiResult<Paciente>> {
  const { data, error, response } = await client.POST('/pacientes', {
    body: { ...datos, confirmar_duplicado: confirmarDuplicado },
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

export async function obtenerPaciente(id: string): Promise<ApiResult<PacienteDetalle>> {
  const { data, error, response } = await client.GET('/pacientes/{id}', {
    params: {
      path: { id },
    },
  });

  if (data) {
    if (esPacienteDetalle(data)) {
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
type RutaTransicionPaciente = '/pacientes/{id}/archivar' | '/pacientes/{id}/desarchivar';

async function transicionarPaciente(
  id: string,
  ruta: RutaTransicionPaciente,
): Promise<ApiResult<Paciente>> {
  const { data, error, response } = await client.POST(ruta, {
    params: { path: { id } },
  });

  if (data && esPaciente(data)) {
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
  }

  return { ok: false, status: 422 };
}

export function archivarPaciente(id: string): Promise<ApiResult<Paciente>> {
  return transicionarPaciente(id, '/pacientes/{id}/archivar');
}

export function desarchivarPaciente(id: string): Promise<ApiResult<Paciente>> {
  return transicionarPaciente(id, '/pacientes/{id}/desarchivar');
}
