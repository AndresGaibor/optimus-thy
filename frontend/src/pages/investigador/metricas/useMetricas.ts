import { useCallback, useEffect, useRef, useState } from 'react';
import { listarMetricas, type MetricasModelo, type ModeloMetricas } from '../../../api/metricas';
import { consultaDe, type FiltrosMetricas } from './compartidos';

interface EstadoMetricas {
  items: MetricasModelo[];
  modelos: ModeloMetricas[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Consulta métricas filtradas y descarta respuestas de filtros anteriores. */
export function useMetricas(filtros: FiltrosMetricas, rangoInvalido: boolean): EstadoMetricas {
  const [items, setItems] = useState<MetricasModelo[]>([]);
  const [modelos, setModelos] = useState<ModeloMetricas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const ultimaPeticion = useRef(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    if (rangoInvalido) {
      setItems([]);
      setCargando(false);
      setError(null);
      return;
    }

    const peticion = ultimaPeticion.current + 1;
    ultimaPeticion.current = peticion;
    setCargando(true);
    setError(null);
    listarMetricas(consultaDe(filtros))
      .then((datos) => {
        if (ultimaPeticion.current !== peticion) return;
        setItems(datos);
        if (!filtros.modelo) {
          setModelos((actuales) => (actuales.length ? actuales : datos.map((fila) => fila.modelo)));
        }
      })
      .catch(() => {
        if (ultimaPeticion.current !== peticion) return;
        setItems([]);
        setError('No se pudieron cargar las métricas. Reintenta la operación.');
      })
      .finally(() => {
        if (ultimaPeticion.current === peticion) setCargando(false);
      });
  }, [filtros, rangoInvalido, intento]);

  return { items, modelos, cargando, error, recargar };
}
