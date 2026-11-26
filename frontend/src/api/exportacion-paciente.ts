import { API_URL } from './client';

export type FormatoExportacionPaciente = 'json' | 'csv';

export async function exportarDatosPaciente(
  pacienteId: string,
  formato: FormatoExportacionPaciente,
): Promise<void> {
  const query = new URLSearchParams({ formato });
  const respuesta = await fetch(
    `${API_URL}/pacientes/${encodeURIComponent(pacienteId)}/exportacion?${query}`,
    { credentials: 'include' },
  );
  if (!respuesta.ok) throw new Error('No se pudieron exportar los datos del paciente.');

  const nombre =
    /filename="([^"]+)"/.exec(respuesta.headers.get('content-disposition') ?? '')?.[1] ??
    `datos-paciente.${formato}`;
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
