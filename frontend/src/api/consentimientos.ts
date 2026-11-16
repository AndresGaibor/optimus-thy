import { client } from './client';

export interface Consentimiento {
  id: string;
  caso_id: string;
  base_legal: string;
  version_texto: string;
  otorgado_en: string;
  revocado_en: string | null;
  vigente: boolean;
}

interface ListaConsentimientos {
  total: number;
  items: Consentimiento[];
}

export async function listarConsentimientos(casoId: string): Promise<Consentimiento[]> {
  const { data, error } = await client.GET('/casos/{caso_id}/consentimientos', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudieron cargar los consentimientos.');
  return (data as unknown as ListaConsentimientos).items;
}

export async function crearConsentimiento(
  casoId: string,
  baseLegal: string,
  versionTexto: string,
): Promise<Consentimiento> {
  const { data, error } = await client.POST('/casos/{caso_id}/consentimientos', {
    params: { path: { caso_id: casoId } },
    body: { base_legal: baseLegal as never, version_texto: versionTexto },
  });
  if (error || !data) throw new Error('No se pudo registrar el consentimiento.');
  return data as unknown as Consentimiento;
}

export async function revocarConsentimiento(casoId: string, id: string): Promise<Consentimiento> {
  const { data, error } = await client.POST(
    '/casos/{caso_id}/consentimientos/{consentimiento_id}/revocar',
    {
      params: { path: { caso_id: casoId, consentimiento_id: id } },
    },
  );
  if (error || !data) throw new Error('No se pudo revocar el consentimiento.');
  return data as unknown as Consentimiento;
}
