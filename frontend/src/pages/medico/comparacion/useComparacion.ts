import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listarResultadosGuardados, type ResultadoGuardado } from '../../../api/resultados';
import {
  agruparPorImagen,
  resumirComparacion,
  type GrupoImagen,
  type ResumenComparacion,
} from './agrupacion';

/** Máximo que acepta `GET /resultados`; se compara sobre esa ventana reciente. */
export const LIMITE_COMPARACION = 50;

const ERROR_CARGA = 'Comprueba la conexión y vuelve a intentarlo.';

export interface EstadoComparacion {
  grupos: GrupoImagen[];
  resumen: ResumenComparacion;
  /** Inferencias disponibles en la institución, no solo las cargadas. */
  total: number;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Carga la ventana reciente de resultados y la agrupa por imagen.
 *
 * La comparación es del cliente: la API ya expone modelo, resultado,
 * confianza y probabilidades por nódulo, pero no un endpoint de comparación.
 */
export function useComparacion(): EstadoComparacion {
  const [items, setItems] = useState<ResultadoGuardado[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const solicitud = useRef(0);

  const cargar = useCallback(async () => {
    const actual = solicitud.current + 1;
    solicitud.current = actual;
    setCargando(true);
    setError(null);
    try {
      const datos = await listarResultadosGuardados({ limite: LIMITE_COMPARACION });
      if (solicitud.current !== actual) return;
      setItems(datos.items);
      setTotal(datos.total);
    } catch {
      if (solicitud.current !== actual) return;
      setItems([]);
      setTotal(0);
      setError(ERROR_CARGA);
    } finally {
      if (solicitud.current === actual) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const grupos = useMemo(() => agruparPorImagen(items), [items]);
  const resumen = useMemo(() => resumirComparacion(grupos), [grupos]);

  return { grupos, resumen, total, cargando, error, recargar: cargar };
}
