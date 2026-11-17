import { client } from './client';

/** Solicita el enlace de recuperación. La API responde 202 exista o no la cuenta. */
export async function solicitarRecuperacion(correo: string): Promise<void> {
  const { error } = await client.POST('/auth/recuperacion', { body: { correo } });
  if (error) {
    throw new Error('No se pudo enviar la solicitud. Reintenta en un momento.');
  }
}

export type ResultadoConfirmacion = 'ok' | 'invalido';

/**
 * Cambia la contraseña con el token del enlace.
 * `invalido` significa enlace vencido, ya usado o desconocido.
 */
export async function confirmarRecuperacion(
  token: string,
  password: string,
): Promise<ResultadoConfirmacion> {
  const { response } = await client.POST('/auth/recuperacion/confirmar', {
    body: { token, password },
  });
  if (response.ok) return 'ok';
  if (response.status === 400) return 'invalido';
  throw new Error('No se pudo cambiar la contraseña. Reintenta en un momento.');
}
