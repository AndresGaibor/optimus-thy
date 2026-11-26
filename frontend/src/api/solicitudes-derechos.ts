import { client } from './client';
import type { components } from './schema';

export type TipoDerecho = 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';
export type EstadoSolicitud = 'pendiente' | 'atendida' | 'rechazada';
export type SolicitudDerecho = Omit<components['schemas']['SolicitudOut'], 'tipo' | 'estado'> & {
  tipo: TipoDerecho;
  estado: EstadoSolicitud;
};
export type Solicitudes = Omit<components['schemas']['SolicitudesOut'], 'items'> & {
  items: SolicitudDerecho[];
};
export type CrearSolicitud = components['schemas']['CrearSolicitudRequest'];
export type CerrarSolicitud = components['schemas']['PatchSolicitudRequest'];
export type Resultado<T> =
  { ok: true; data: T } | { ok: false; error: string; codigo?: string | undefined };

const ERROR_LISTAR = 'No se pudieron cargar las solicitudes. Reintenta la operación.';
const ERROR_CREAR = 'No se pudo registrar la solicitud. Revisa los datos e inténtalo de nuevo.';
const ERROR_CERRAR = 'No se pudo cerrar la solicitud. Revisa la respuesta e inténtalo de nuevo.';

function esSolicitudDerecho(valor: unknown): valor is SolicitudDerecho {
  if (typeof valor !== 'object' || valor === null) return false;
  const solicitud = valor as Record<string, unknown>;
  const responsable = solicitud.responsable;
  if (typeof responsable !== 'object' || responsable === null) return false;
  const personaResponsable = responsable as Record<string, unknown>;
  return (
    typeof solicitud.id === 'string' &&
    ['acceso', 'rectificacion', 'cancelacion', 'oposicion'].includes(String(solicitud.tipo)) &&
    typeof solicitud.referencia_titular === 'string' &&
    typeof solicitud.solicitada_en === 'string' &&
    typeof solicitud.plazo_dias === 'number' &&
    typeof solicitud.fecha_limite === 'string' &&
    typeof solicitud.dias_restantes === 'number' &&
    typeof solicitud.vencida === 'boolean' &&
    ['pendiente', 'atendida', 'rechazada'].includes(String(solicitud.estado)) &&
    (typeof solicitud.respuesta === 'string' || solicitud.respuesta === null) &&
    typeof personaResponsable.id === 'string' &&
    (typeof personaResponsable.rol === 'string' || personaResponsable.rol === null) &&
    typeof solicitud.creado_en === 'string' &&
    typeof solicitud.actualizado_en === 'string'
  );
}

function esSolicitudes(valor: unknown): valor is Solicitudes {
  if (typeof valor !== 'object' || valor === null) return false;
  const listado = valor as Record<string, unknown>;
  return (
    typeof listado.total === 'number' &&
    typeof listado.pendientes === 'number' &&
    typeof listado.vencidas === 'number' &&
    Array.isArray(listado.items) &&
    listado.items.every(esSolicitudDerecho)
  );
}

function extraerCodigo(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const cuerpo = error as Record<string, unknown>;
  const anidado =
    typeof cuerpo.error === 'object' && cuerpo.error !== null
      ? (cuerpo.error as Record<string, unknown>)
      : typeof cuerpo.detail === 'object' && cuerpo.detail !== null
        ? (cuerpo.detail as Record<string, unknown>)
        : null;
  if (anidado === null) return undefined;
  const codigo = anidado.code ?? anidado.codigo;
  return typeof codigo === 'string' ? codigo : undefined;
}

/** Solicitudes administrativas de derechos de titulares; nunca incluye datos clínicos. */
export async function listarSolicitudes(estado?: EstadoSolicitud): Promise<Resultado<Solicitudes>> {
  try {
    const { data, error } = await client.GET('/administrador/solicitudes-derechos', {
      params: { query: estado ? { estado } : {} },
    });
    if (error || !esSolicitudes(data)) return { ok: false, error: ERROR_LISTAR };
    return { ok: true, data };
  } catch {
    return { ok: false, error: ERROR_LISTAR };
  }
}

export async function crearSolicitud(cuerpo: CrearSolicitud): Promise<Resultado<SolicitudDerecho>> {
  try {
    const { data, error } = await client.POST('/administrador/solicitudes-derechos', {
      body: cuerpo,
    });
    if (error || !esSolicitudDerecho(data)) {
      return { ok: false, error: ERROR_CREAR, codigo: extraerCodigo(error) };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: ERROR_CREAR };
  }
}

export async function cerrarSolicitud(
  id: string,
  cuerpo: CerrarSolicitud,
): Promise<Resultado<SolicitudDerecho>> {
  try {
    const { data, error } = await client.PATCH(
      '/administrador/solicitudes-derechos/{solicitud_id}',
      {
        params: { path: { solicitud_id: id } },
        body: cuerpo,
      },
    );
    if (error || !esSolicitudDerecho(data)) {
      return { ok: false, error: ERROR_CERRAR, codigo: extraerCodigo(error) };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: ERROR_CERRAR };
  }
}
