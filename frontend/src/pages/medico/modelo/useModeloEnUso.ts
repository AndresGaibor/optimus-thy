import { useCallback, useEffect, useRef, useState } from 'react';
import { listarResultadosGuardados } from '../../../api/resultados';

/** Versión del modelo que produjo la inferencia más reciente de la institución. */
export interface ModeloEnUso {
  nombre: string;
  version: string;
  /** Huella SHA-256 de los tres archivos de pesos usados en esa inferencia. */
  huella: string | null;
  inferenciaEn: string;
}

interface EstadoModeloEnUso {
  modelo: ModeloEnUso | null;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

const ERROR_CONSULTA = 'No se pudo consultar la versión del modelo.';

/**
 * Lee el modelo de la última inferencia registrada.
 *
 * `GET /modelos-ia` exige el permiso `ajustes.gestionar`, que no tienen los
 * médicos; la ficha real de la versión y la huella de pesos llega con cada
 * resultado de `GET /resultados`, que sí admite `inferencia.leer`.
 */
export function useModeloEnUso(): EstadoModeloEnUso {
  const [modelo, setModelo] = useState<ModeloEnUso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const solicitud = useRef(0);

  const cargar = useCallback(async () => {
    const actual = solicitud.current + 1;
    solicitud.current = actual;
    setCargando(true);
    setError(null);
    try {
      const datos = await listarResultadosGuardados({ limite: 1 });
      if (solicitud.current !== actual) return;
      const ultima = datos.items[0];
      setModelo(
        ultima
          ? {
              nombre: ultima.modelo.nombre,
              version: ultima.modelo.version,
              huella: ultima.huella_modelos,
              inferenciaEn: ultima.creado_en,
            }
          : null,
      );
    } catch {
      if (solicitud.current !== actual) return;
      setModelo(null);
      setError(ERROR_CONSULTA);
    } finally {
      if (solicitud.current === actual) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { modelo, cargando, error, recargar: cargar };
}
