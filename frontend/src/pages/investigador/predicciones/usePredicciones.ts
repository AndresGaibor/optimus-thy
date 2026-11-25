import { useCallback, useEffect, useRef, useState } from 'react';
import { type PrediccionAuditada, listarPrediccionesAuditadas } from '../../../api/predicciones';
import { consultaDe, type FiltrosPredicciones } from './compartidos';

interface EstadoPredicciones {
  items: PrediccionAuditada[];
  total: number;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Carga las predicciones con los filtros del servidor y descarta respuestas viejas. */
export function usePredicciones(
  filtros: FiltrosPredicciones,
  limite: number,
  desplazamiento: number,
  rangoInvalido: boolean,
): EstadoPredicciones {
  const [items, setItems] = useState<PrediccionAuditada[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const ultimaPeticion = useRef(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    if (rangoInvalido) {
      setItems([]);
      setTotal(0);
      setCargando(false);
      setError(null);
      return;
    }
    const peticion = ultimaPeticion.current + 1;
    ultimaPeticion.current = peticion;
    setCargando(true);
    setError(null);
    listarPrediccionesAuditadas({
      ...consultaDe(filtros),
      limite,
      desplazamiento,
    })
      .then((datos) => {
        if (ultimaPeticion.current !== peticion) return;
        setItems(datos.items);
        setTotal(datos.total);
      })
      .catch(() => {
        if (ultimaPeticion.current !== peticion) return;
        setItems([]);
        setTotal(0);
        setError('No se pudieron cargar las predicciones. Reintenta la operación.');
      })
      .finally(() => {
        if (ultimaPeticion.current === peticion) setCargando(false);
      });
  }, [filtros, limite, desplazamiento, rangoInvalido, intento]);

  return { items, total, cargando, error, recargar };
}
