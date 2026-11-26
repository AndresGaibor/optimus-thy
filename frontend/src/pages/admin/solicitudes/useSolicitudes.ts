import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type EstadoSolicitud,
  type Solicitudes,
  listarSolicitudes,
} from '../../../api/solicitudes-derechos';

type EstadoCarga =
  | { estado: 'cargando'; datos: null; error: null }
  | { estado: 'error'; datos: null; error: string }
  | { estado: 'datos'; datos: Solicitudes; error: null };

type ResultadoSolicitudes = EstadoCarga & {
  recargar: () => void;
};

/** Carga las solicitudes para el filtro elegido y descarta respuestas obsoletas. */
export function useSolicitudes(filtro?: EstadoSolicitud): ResultadoSolicitudes {
  const [resultado, setResultado] = useState<EstadoCarga>({
    estado: 'cargando',
    datos: null,
    error: null,
  });
  const [intento, setIntento] = useState(0);
  const ultimaPeticion = useRef(0);
  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    const peticion = ultimaPeticion.current + 1;
    ultimaPeticion.current = peticion;
    setResultado({ estado: 'cargando', datos: null, error: null });
    listarSolicitudes(filtro).then((respuesta) => {
      if (ultimaPeticion.current !== peticion) return;
      setResultado(
        respuesta.ok
          ? { estado: 'datos', datos: respuesta.data, error: null }
          : { estado: 'error', datos: null, error: respuesta.error },
      );
    });
  }, [filtro, intento]);

  return { ...resultado, recargar };
}
