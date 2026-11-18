import { client } from './client';
import type { components } from './schema';

export type ConfiguracionCorreo = components['schemas']['ConfiguracionOut'];
export type EntradaConfiguracion = components['schemas']['ConfiguracionIn'];
export type PlantillaCorreo = components['schemas']['PlantillaOut'];
export type EntradaPlantilla = components['schemas']['PlantillaIn'];

interface ErrorApi {
  error?: { code?: string; message?: string };
}

function fallo(error: unknown, porDefecto: string): Error {
  const mensaje = (error as ErrorApi | undefined)?.error?.message;
  return new Error(mensaje ?? porDefecto);
}

/** Configuración SMTP guardada; la contraseña nunca llega, solo `tiene_password`. */
export async function leerConfiguracion(): Promise<ConfiguracionCorreo> {
  const { data, error } = await client.GET('/configuracion-correo');
  if (error || !data) throw fallo(error, 'No se pudo leer la configuración del correo.');
  return data;
}

/** Guarda el servidor; la contraseña solo se reemplaza si viene con valor. */
export async function guardarConfiguracion(
  entrada: EntradaConfiguracion,
): Promise<ConfiguracionCorreo> {
  const { data, error } = await client.PUT('/configuracion-correo', { body: entrada });
  if (error || !data) throw fallo(error, 'No se pudo guardar la configuración.');
  return data;
}

/** Envía un correo de prueba a la cuenta del administrador conectado. */
export async function probarEnvio(): Promise<{ destinatario: string }> {
  const { data, error } = await client.POST('/configuracion-correo/probar');
  if (error || !data) throw fallo(error, 'No se pudo enviar la prueba.');
  return data;
}

export async function leerPlantilla(): Promise<PlantillaCorreo> {
  const { data, error } = await client.GET('/plantillas-correo/{clave}', {
    params: { path: { clave: 'recuperacion' } },
  });
  if (error || !data) throw fallo(error, 'No se pudo leer la plantilla.');
  return data;
}

export async function guardarPlantilla(entrada: EntradaPlantilla): Promise<PlantillaCorreo> {
  const { data, error } = await client.PUT('/plantillas-correo/{clave}', {
    params: { path: { clave: 'recuperacion' } },
    body: entrada,
  });
  if (error || !data) throw fallo(error, 'No se pudo guardar la plantilla.');
  return data;
}

export async function restaurarPlantilla(): Promise<PlantillaCorreo> {
  const { data, error } = await client.POST('/plantillas-correo/{clave}/restaurar', {
    params: { path: { clave: 'recuperacion' } },
  });
  if (error || !data) throw fallo(error, 'No se pudo restaurar la plantilla.');
  return data;
}

/** Correo tal como llegará, con datos de ejemplo; no guarda ni envía. */
export async function previsualizarPlantilla(
  entrada: EntradaPlantilla,
): Promise<{ asunto: string; html: string }> {
  const { data, error } = await client.POST('/plantillas-correo/{clave}/preview', {
    params: { path: { clave: 'recuperacion' } },
    body: entrada,
  });
  if (error || !data) throw fallo(error, 'No se pudo generar la vista previa.');
  return data;
}
