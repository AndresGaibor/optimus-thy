import { useEffect, useMemo, useState } from 'react';
import { listarEstadosOcr, type EstadoOcrApi } from '../../api/documentos';
import type { DocumentoCasoDemo } from '../fixtures/documentos-extra';

const ETIQUETAS_ESTADO_OCR: Record<EstadoOcrApi, DocumentoCasoDemo['estadoOcr']> = {
  no_solicitado: 'Sin procesar',
  en_cola: 'En cola',
  procesando: 'Procesando',
  listo: 'Listo',
  error: 'Error',
};

type EstadoOcrActualizado = {
  estadoOcr: DocumentoCasoDemo['estadoOcr'];
  motivoError: string | null;
};

/** Sondea el estado del OCR cada 3 s mientras haya documentos en cola o en proceso. */
export function useEstadosOcr(documents: DocumentoCasoDemo[], casoId: string): DocumentoCasoDemo[] {
  const [estadoOcrActualizado, setEstadoOcrActualizado] = useState<{
    casoId: string;
    documentos: Record<string, EstadoOcrActualizado>;
  }>(() => ({ casoId, documentos: {} }));
  const documentosConOcr = useMemo(() => {
    const estadosDelCaso: Record<string, EstadoOcrActualizado> =
      estadoOcrActualizado.casoId === casoId ? estadoOcrActualizado.documentos : {};
    return documents.map((document) => {
      const estado = estadosDelCaso[document.id];
      if (!estado) return document;
      const actualizado = { ...document, estadoOcr: estado.estadoOcr };
      if (estado.motivoError === null) delete actualizado.motivoError;
      else actualizado.motivoError = estado.motivoError;
      return actualizado;
    });
  }, [documents, estadoOcrActualizado, casoId]);
  const hayOcrActivo = documentosConOcr.some(
    (document) => document.estadoOcr === 'En cola' || document.estadoOcr === 'Procesando',
  );

  useEffect(() => {
    if (!hayOcrActivo) return;
    const temporizador = window.setInterval(() => {
      void listarEstadosOcr(casoId)
        .then((estados) => {
          if (!estados) return;
          const actualizaciones: Record<string, EstadoOcrActualizado> = Object.fromEntries(
            estados.map((documento) => [
              documento.id,
              {
                estadoOcr: ETIQUETAS_ESTADO_OCR[documento.estado_ocr],
                motivoError: documento.ocr_motivo,
              },
            ]),
          );
          setEstadoOcrActualizado((anterior) => ({
            casoId,
            documentos: {
              ...(anterior.casoId === casoId ? anterior.documentos : {}),
              ...actualizaciones,
            },
          }));
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(temporizador);
  }, [casoId, hayOcrActivo]);

  return documentosConOcr;
}
