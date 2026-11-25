import { client } from './client';
import type { components } from './schema';

export type EntradaDecision = components['schemas']['DecisionIn'];
export type CategoriaDecision = EntradaDecision['decision'];

/** Decisión registrada; el autor solo expone identificador y rol. */
export interface DecisionRegistrada {
  decision: CategoriaDecision;
  observaciones: string | null;
  creado_en: string;
  autor: { id: string; rol: string | null };
}

interface ErrorApi {
  error?: { code?: string; message?: string };
}

/** La inferencia ya tenía una decisión: no se reenvía ni se sobrescribe. */
export class DecisionExistenteError extends Error {
  constructor() {
    super('La inferencia ya tiene una decisión registrada.');
    this.name = 'DecisionExistenteError';
  }
}

/** Decisión ya registrada, o `null` si la inferencia todavía no tiene una. */
export async function consultarDecision(
  casoId: string,
  inferenciaId: string,
): Promise<DecisionRegistrada | null> {
  const { data, error, response } = await client.GET(
    '/casos/{caso_id}/inferencias/{inferencia_id}/decision',
    { params: { path: { caso_id: casoId, inferencia_id: inferenciaId } } },
  );
  const codigo = (error as ErrorApi | undefined)?.error?.code;
  if (response.status === 404 && codigo === 'decision_no_encontrada') {
    return null;
  }
  if (error || !data) throw new Error('No se pudo consultar la decisión registrada.');
  return data as DecisionRegistrada;
}

/** Registra la conclusión; un segundo envío se informa con `DecisionExistenteError`. */
export async function registrarDecision(
  casoId: string,
  inferenciaId: string,
  entrada: EntradaDecision,
): Promise<DecisionRegistrada> {
  const { data, error, response } = await client.POST(
    '/casos/{caso_id}/inferencias/{inferencia_id}/decision',
    {
      params: { path: { caso_id: casoId, inferencia_id: inferenciaId } },
      body: entrada,
    },
  );
  const codigo = (error as ErrorApi | undefined)?.error?.code;
  if (response.status === 409 && codigo === 'decision_existente') {
    throw new DecisionExistenteError();
  }
  if (error || !data) throw new Error('No se pudo registrar la conclusión.');
  return data as DecisionRegistrada;
}
