import { useCallback, useEffect, useRef, useState } from 'react';
import { type DatasetResumen, listarDatasets } from '../../../api/datasets';

interface EstadoDatasets {
  items: DatasetResumen[];
  total: number;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Carga los datasets de la institución y descarta respuestas viejas. */
export function useDatasets(): EstadoDatasets {
  const [items, setItems] = useState<DatasetResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const ultimaPeticion = useRef(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    const peticion = ultimaPeticion.current + 1;
    ultimaPeticion.current = peticion;
    setCargando(true);
    setError(null);
    listarDatasets()
      .then((respuesta) => {
        if (ultimaPeticion.current !== peticion) return;
        if (!respuesta.ok) {
          setItems([]);
          setTotal(0);
          setError(respuesta.error);
          return;
        }
        setItems(respuesta.data.items);
        setTotal(respuesta.data.total);
      })
      .finally(() => {
        if (ultimaPeticion.current === peticion) setCargando(false);
      });
  }, [intento]);

  return { items, total, cargando, error, recargar };
}
