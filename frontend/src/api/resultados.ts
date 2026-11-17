import { API_URL, client } from './client';

export interface Artefactos {
  mascara_url: string | null;
  mgac_url: string | null;
  xml_url: string | null;
  superposicion_url: string | null;
}

export interface NoduloInferencia {
  indice: number;
  clase: string | null;
  confianza: number | null;
  probabilidad_benigno: number | null;
  probabilidad_maligno: number | null;
  caja: { x: number | null; y: number | null; w: number | null; h: number | null };
  region_analizada: Record<string, number> | null;
  pixeles_mascara: number | null;
  artefactos: Artefactos;
}

export interface Inferencia {
  id: string;
  imagen_id: string;
  modelo: { id: string; nombre: string; version: string };
  resultado: string;
  confianza: number | null;
  tiempo_ms: number | null;
  ancho: number | null;
  alto: number | null;
  version_contrato: string | null;
  huella_modelos: string | null;
  umbrales: Record<string, number> | null;
  creado_en: string;
  nodulos: NoduloInferencia[];
}

interface ListaInferencias {
  total: number;
  items: Inferencia[];
}

export async function listarResultados(casoId: string): Promise<Inferencia[]> {
  const { data, error } = await client.GET('/casos/{caso_id}/inferencias', {
    params: { path: { caso_id: casoId } },
  });
  if (error || !data) throw new Error('No se pudieron cargar los resultados.');
  return (data as unknown as ListaInferencias).items;
}

export interface ResultadoGuardado extends Inferencia {
  caso_id: string;
  caso_codigo: string;
  paciente_codigo: string;
}

export interface FiltrosResultados {
  paciente?: string;
  desde?: string;
  hasta?: string;
  clase?: string;
  limite?: number;
  desplazamiento?: number;
}

/** Resultados de toda la institución con filtros combinables (HU-081). */
export async function listarResultadosGuardados(
  filtros: FiltrosResultados = {},
): Promise<{ total: number; items: ResultadoGuardado[] }> {
  const query: Record<string, string | number> = {};
  for (const clave of ['paciente', 'desde', 'hasta', 'clase'] as const) {
    const valor = filtros[clave];
    if (valor) query[clave] = valor;
  }
  if (typeof filtros.limite === 'number') query.limite = filtros.limite;
  if (typeof filtros.desplazamiento === 'number') query.desplazamiento = filtros.desplazamiento;

  const { data, error } = await client.GET('/resultados', {
    params: { query: query as never },
  });
  if (error || !data) throw new Error('No se pudieron cargar los resultados.');
  return data as unknown as { total: number; items: ResultadoGuardado[] };
}

/** Descarga el PDF de una inferencia con la sesión ya abierta (HU-080). */
export async function descargarReporte(
  casoId: string,
  inferenciaId: string,
): Promise<{ contenido: Blob; nombre: string }> {
  const respuesta = await fetch(
    `${API_URL}/casos/${encodeURIComponent(casoId)}/inferencias/${encodeURIComponent(inferenciaId)}/reporte.pdf`,
    { credentials: 'include' },
  );
  if (!respuesta.ok) throw new Error('No se pudo generar el reporte.');
  const disposicion = respuesta.headers.get('content-disposition') ?? '';
  const nombre = /filename="([^"]+)"/.exec(disposicion)?.[1] ?? 'reporte.pdf';
  return { contenido: await respuesta.blob(), nombre };
}
