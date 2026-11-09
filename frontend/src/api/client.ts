import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

const baseUrl = import.meta.env.VITE_API_URL || '/api';

// `fetch` se resuelve en cada llamada para poder sustituir el global en pruebas.
export const client = createClient<paths>({
  baseUrl,
  fetch: (request) => globalThis.fetch(request),
});

export type Health = components['schemas']['Health'];

export async function getHealth(): Promise<Health> {
  const { data, error } = await client.GET('/health');
  if (error || !data) {
    throw new Error('No se pudo consultar el estado del servicio');
  }
  return data;
}
