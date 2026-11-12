import { client } from './client';

export type EstadoOcrApi = 'no_solicitado' | 'en_cola' | 'procesando' | 'listo' | 'error';

export interface DocumentoOcrEstado {
  id: string;
  estado_ocr: EstadoOcrApi;
  ocr_motivo: string | null;
}

function esDocumentoOcrEstado(valor: unknown): valor is DocumentoOcrEstado {
  if (typeof valor !== 'object' || valor === null) return false;
  const documento = valor as Record<string, unknown>;
  const estado = documento.estado_ocr;
  const motivo = documento.ocr_motivo;

  return (
    typeof documento.id === 'string' &&
    (estado === 'no_solicitado' ||
      estado === 'en_cola' ||
      estado === 'procesando' ||
      estado === 'listo' ||
      estado === 'error') &&
    (estado === 'error' ? typeof motivo === 'string' : motivo === null)
  );
}

function esRespuestaDocumentos(valor: unknown): valor is { documentos: DocumentoOcrEstado[] } {
  if (typeof valor !== 'object' || valor === null) return false;
  const documentos = (valor as Record<string, unknown>).documentos;
  return Array.isArray(documentos) && documentos.every(esDocumentoOcrEstado);
}

export async function listarEstadosOcr(casoId: string): Promise<DocumentoOcrEstado[] | null> {
  const { data, error } = await client.GET('/casos/{caso_id}/documentos', {
    params: { path: { caso_id: casoId } },
  });

  if (error !== undefined || !esRespuestaDocumentos(data)) return null;
  return data.documentos;
}

export interface DocumentoEnlace {
  enlace: string;
  caduca_en: string;
}

function esDocumentoEnlace(valor: unknown): valor is DocumentoEnlace {
  if (typeof valor !== 'object' || valor === null) return false;
  const enlace = valor as Record<string, unknown>;

  return (
    typeof enlace.enlace === 'string' &&
    enlace.enlace.length > 0 &&
    typeof enlace.caduca_en === 'string' &&
    enlace.caduca_en.length > 0
  );
}

/** Enlace firmado de corta vida para abrir o descargar un documento del caso. */
export async function obtenerEnlaceDocumento(
  casoId: string,
  documentoId: string,
): Promise<DocumentoEnlace | null> {
  const { data, error } = await client.POST('/casos/{caso_id}/documentos/{documento_id}/enlace', {
    params: { path: { caso_id: casoId, documento_id: documentoId } },
  });

  if (error !== undefined || !esDocumentoEnlace(data)) return null;
  return data;
}
