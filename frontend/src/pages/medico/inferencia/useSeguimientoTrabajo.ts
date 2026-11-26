import { useCallback, useRef, type MutableRefObject } from 'react';
import { consultarTrabajo } from '../../../api/trabajos';
import { INTERVALO_MS } from './compartidos';

interface OpcionesSeguimiento {
  /** Caso que se está viendo; el seguimiento se detiene si deja de coincidir. */
  casoActual: MutableRefObject<string>;
  /** Se invoca al completarse el trabajo. */
  alCompletar: (casoId: string) => void | Promise<void>;
  /** Se invoca con el mensaje cuando el trabajo falla o no se puede consultar. */
  alFallar: (mensaje: string) => void;
}

/** Consulta periódicamente un trabajo y avisa cuando termina o falla. */
export function useSeguimientoTrabajo({ casoActual, alCompletar, alFallar }: OpcionesSeguimiento) {
  const intervalo = useRef<number | null>(null);

  const detener = useCallback(() => {
    if (intervalo.current !== null) {
      window.clearInterval(intervalo.current);
      intervalo.current = null;
    }
  }, []);

  const esperar = useCallback(
    (trabajoId: string, casoDelTrabajo: string) => {
      detener();
      intervalo.current = window.setInterval(() => {
        void (async () => {
          if (casoActual.current !== casoDelTrabajo) {
            detener();
            return;
          }
          try {
            const trabajo = await consultarTrabajo(trabajoId);
            if (casoActual.current !== casoDelTrabajo) {
              detener();
              return;
            }
            if (trabajo.estado === 'completado') {
              detener();
              await alCompletar(casoDelTrabajo);
            } else if (trabajo.estado === 'error') {
              detener();
              alFallar(
                trabajo.error_detalle === 'imagen_no_parece_ecografia'
                  ? 'La imagen no parece una ecografía tiroidea. Selecciona una ecografía.'
                  : 'La inferencia falló. Revisa el estado del servicio de IA e inténtalo de nuevo.',
              );
            }
          } catch {
            detener();
            alFallar('No se pudo consultar el trabajo de inferencia.');
          }
        })();
      }, INTERVALO_MS);
    },
    [alCompletar, alFallar, casoActual, detener],
  );

  return { detener, esperar };
}
