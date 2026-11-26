import { useCallback, useEffect, useRef, useState } from 'react';
import { type Errores, type TipoError, listarErrores } from '../../../api/errores';

interface EstadoErrores {
  datos: Errores | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Errores del modelo para el filtro elegido; descarta respuestas viejas. */
export function useErrores(tipo: TipoError): EstadoErrores {
  const [datos, setDatos] = useState<Errores | null>(null);
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
    listarErrores(tipo)
      .then((respuesta) => {
        if (ultimaPeticion.current !== peticion) return;
        if (!respuesta.ok) {
          setError(respuesta.error);
          setDatos(null);
          return;
        }
        setDatos(respuesta.data);
      })
      .finally(() => {
        if (ultimaPeticion.current === peticion) setCargando(false);
      });
  }, [tipo, intento]);

  return { datos, cargando, error, recargar };
}
