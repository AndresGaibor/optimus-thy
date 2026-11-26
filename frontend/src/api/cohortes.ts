import { API_URL } from './client';

export interface FiltrosCohorte {
  edad_min?: number;
  edad_max?: number;
  tirads?: string;
  bethesda?: string;
  tipo_diagnostico?: string;
  desde?: string;
  hasta?: string;
}

export interface CohorteInvestigacion {
  id: string;
  nombre: string;
  filtros: FiltrosCohorte;
  total_casos: number;
  creado_en: string;
  actualizado_en: string;
}

export interface ListaCohortes {
  total: number;
  items: CohorteInvestigacion[];
}

export type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_LISTA = 'No se pudieron cargar las cohortes. Reintenta la operación.';
const ERROR_CREAR = 'No se pudo guardar la cohorte. Revisa los filtros e inténtalo de nuevo.';

async function enviar<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!respuesta.ok) {
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    let mensaje: string | undefined;
    if (typeof cuerpo === 'object' && cuerpo !== null && 'error' in cuerpo) {
      const detalle = cuerpo.error;
      if (
        typeof detalle === 'object' &&
        detalle !== null &&
        'message' in detalle &&
        typeof detalle.message === 'string'
      ) {
        mensaje = detalle.message;
      }
    }
    throw new Error(mensaje ?? ERROR_CREAR);
  }
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

export async function listarCohortes(): Promise<Resultado<ListaCohortes>> {
  try {
    return { ok: true, data: await enviar<ListaCohortes>('/cohortes') };
  } catch {
    return { ok: false, error: ERROR_LISTA };
  }
}

export async function crearCohorte(
  nombre: string,
  filtros: FiltrosCohorte,
): Promise<Resultado<CohorteInvestigacion>> {
  try {
    return {
      ok: true,
      data: await enviar<CohorteInvestigacion>('/cohortes', {
        method: 'POST',
        body: JSON.stringify({ nombre, filtros }),
      }),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : ERROR_CREAR };
  }
}

export async function borrarCohorte(id: string): Promise<Resultado<void>> {
  try {
    await enviar<void>(`/cohortes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo borrar la cohorte. Reintenta la operación.' };
  }
}
