import { useCallback, useEffect, useRef, useState } from 'react';
import { listarResultados, listarResultadosGuardados } from '../../../api/resultados';
import {
  filaDeInferencia,
  filaDeResultado,
  LIMITE_POR_PAGINA,
  type FilaHistorial,
} from './compartidos';

export interface ParametrosHistorial {
  /** Caso cuyo historial se consulta; vacío para el historial de la institución. */
  casoId?: string;
  paciente: string;
  desde: string;
  hasta: string;
  clase: string;
  desplazamiento: number;
}

interface EstadoHistorial {
  filas: FilaHistorial[];
  total: number;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

const ERROR_CARGA = 'Comprueba la conexión y vuelve a intentarlo.';

/** Carga el historial real, por caso o institucional, con paginación y descarte de respuestas viejas. */
export function useHistorial({
  casoId,
  paciente,
  desde,
  hasta,
  clase,
  desplazamiento,
}: ParametrosHistorial): EstadoHistorial {
  const [filas, setFilas] = useState<FilaHistorial[]>([]);
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
      if (casoId) {
        const inferencias = await listarResultados(casoId);
        if (solicitud.current !== actual) return;
        const todas = inferencias.map((inferencia) => filaDeInferencia(inferencia, casoId));
        setTotal(todas.length);
        setFilas(todas.slice(desplazamiento, desplazamiento + LIMITE_POR_PAGINA));
      } else {
        const datos = await listarResultadosGuardados({
          ...(paciente ? { paciente } : {}),
          ...(desde ? { desde } : {}),
          ...(hasta ? { hasta } : {}),
          ...(clase ? { clase } : {}),
          limite: LIMITE_POR_PAGINA,
          desplazamiento,
        });
        if (solicitud.current !== actual) return;
        setFilas(datos.items.map(filaDeResultado));
        setTotal(datos.total);
      }
    } catch {
      if (solicitud.current !== actual) return;
      setFilas([]);
      setTotal(0);
      setError(ERROR_CARGA);
    } finally {
      if (solicitud.current === actual) setCargando(false);
    }
  }, [casoId, paciente, desde, hasta, clase, desplazamiento]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { filas, total, cargando, error, recargar: cargar };
}
