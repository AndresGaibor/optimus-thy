import { useCallback, useEffect, useRef, useState } from 'react';
import { type Dataset, obtenerDataset } from '../../../api/datasets';

interface EstadoDetalle {
  dataset: Dataset | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Carga las filas anonimizadas del dataset elegido y descarta respuestas viejas. */
export function useDetalleDataset(id: string | null): EstadoDetalle {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const ultimaPeticion = useRef(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    if (!id) {
      setDataset(null);
      setCargando(false);
      setError(null);
      return;
    }
    const peticion = ultimaPeticion.current + 1;
    ultimaPeticion.current = peticion;
    setDataset(null);
    setCargando(true);
    setError(null);
    obtenerDataset(id)
      .then((respuesta) => {
        if (ultimaPeticion.current !== peticion) return;
        if (!respuesta.ok) {
          setError(respuesta.error);
          return;
        }
        setDataset(respuesta.data);
      })
      .finally(() => {
        if (ultimaPeticion.current === peticion) setCargando(false);
      });
  }, [id, intento]);

  return { dataset, cargando, error, recargar };
}
