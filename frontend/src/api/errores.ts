import { client } from './client';
import type { components } from './schema';

export type ErrorPrediccion = components['schemas']['ErrorPrediccionOut'];
export type Errores = components['schemas']['ErroresOut'];

export type TipoError = 'todos' | 'falso_positivo' | 'falso_negativo';

export type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

const ERROR_LISTA = 'No se pudieron cargar los errores. Reintenta la operación.';

/** Falsos positivos y negativos según la corrección médica (RF-INV-07). */
export async function listarErrores(tipo: TipoError): Promise<Resultado<Errores>> {
  try {
    const { data, error } = await client.GET('/investigacion/errores', {
      params: { query: { tipo } },
    });
    if (error || !data) return { ok: false, error: ERROR_LISTA };
    return { ok: true, data };
  } catch {
    return { ok: false, error: ERROR_LISTA };
  }
}
