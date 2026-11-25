import { API_URL, client } from './client';
import type { components } from './schema';

export type ModeloIA = components['schemas']['ModeloOut'];

// Los paquetes de pesos pesan ~400 MB y ni el borde nginx ni Cloudflare aceptan
// un cuerpo tan grande: se envían en trozos que el backend ensambla.
const TROZO = 25 * 1024 * 1024;

async function falloDe(respuesta: Response): Promise<Error> {
  try {
    const cuerpo = (await respuesta.json()) as { error?: { message?: string } };
    return new Error(cuerpo.error?.message ?? `Error ${respuesta.status}`);
  } catch {
    return new Error(`Error ${respuesta.status}`);
  }
}

export async function listarModelos(): Promise<ModeloIA[]> {
  const { data, error } = await client.GET('/modelos-ia');
  if (error || !data) throw new Error('No se pudieron cargar los modelos de IA.');
  return data;
}

export async function subirModelo(
  archivo: File,
  nombre: string,
  version: string,
  alAvanzar?: (fraccion: number) => void,
): Promise<ModeloIA> {
  const datos = new FormData();
  datos.append('nombre', nombre);
  datos.append('version', version);
  const inicio = await fetch(`${API_URL}/modelos-ia/paquetes`, {
    method: 'POST',
    body: datos,
    credentials: 'include',
  });
  if (!inicio.ok) throw await falloDe(inicio);
  const { id } = (await inicio.json()) as { id: string };
  const cancelar = () =>
    fetch(`${API_URL}/modelos-ia/paquetes/${id}`, { method: 'DELETE', credentials: 'include' });
  for (let indice = 0, desde = 0; desde < archivo.size; indice += 1, desde += TROZO) {
    const trozo = archivo.slice(desde, Math.min(desde + TROZO, archivo.size));
    const respuesta = await fetch(`${API_URL}/modelos-ia/paquetes/${id}/trozos/${indice}`, {
      method: 'PUT',
      body: trozo,
      headers: { 'Content-Type': 'application/octet-stream' },
      credentials: 'include',
    });
    if (!respuesta.ok) {
      void cancelar();
      throw await falloDe(respuesta);
    }
    alAvanzar?.(Math.min(desde + trozo.size, archivo.size) / archivo.size);
  }
  const cierre = await fetch(`${API_URL}/modelos-ia/paquetes/${id}/cerrar`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!cierre.ok) throw await falloDe(cierre);
  return (await cierre.json()) as ModeloIA;
}

export async function activarModelo(id: string): Promise<ModeloIA> {
  const { data, error } = await client.POST('/modelos-ia/{id}/activar', {
    params: { path: { id } },
  });
  if (error || !data) throw new Error('No se pudo activar el modelo de IA.');
  return data;
}
