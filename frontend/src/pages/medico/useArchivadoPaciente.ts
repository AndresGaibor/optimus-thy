import { useCallback, useState } from 'react';
import { archivarPaciente, desarchivarPaciente, type Paciente } from '../../api/pacientes';

interface Opciones {
  cargarPacientes: () => Promise<void> | void;
  desplazamiento: number;
  incluirArchivados: boolean;
  irAlInicio: () => void;
  avisar: (texto: string) => void;
}

interface ArchivadoPaciente {
  paciente: Paciente | null;
  cargando: boolean;
  error: string | null;
  abrir: (paciente: Paciente) => void;
  cerrar: () => void;
  confirmar: () => Promise<void>;
}

/**
 * Archivado y desarchivado de un paciente con confirmación previa.
 *
 * Mantiene el paciente en transición, el estado de la petición y el error visible
 * en el diálogo; la página se queda con la lista y el aviso de éxito.
 */
export function useArchivadoPaciente({
  cargarPacientes,
  desplazamiento,
  incluirArchivados,
  irAlInicio,
  avisar,
}: Opciones): ArchivadoPaciente {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abrir = useCallback((elegido: Paciente) => {
    setError(null);
    setPaciente(elegido);
  }, []);

  const cerrar = useCallback(() => {
    if (cargando) {
      return;
    }
    setPaciente(null);
    setError(null);
  }, [cargando]);

  const confirmar = useCallback(async () => {
    if (!paciente || cargando) {
      return;
    }

    const desarchivar = paciente.archivado_en !== null;
    setCargando(true);
    setError(null);
    const resultado = desarchivar
      ? await desarchivarPaciente(paciente.id)
      : await archivarPaciente(paciente.id);

    if (!resultado.ok) {
      setError(
        desarchivar
          ? 'No se pudo desarchivar el paciente. Reintenta la operación.'
          : 'No se pudo archivar el paciente. Reintenta la operación.',
      );
      setCargando(false);
      return;
    }

    setPaciente(null);
    setCargando(false);
    avisar(
      desarchivar ? 'Paciente desarchivado correctamente.' : 'Paciente archivado correctamente.',
    );
    if (!desarchivar && !incluirArchivados && desplazamiento > 0) {
      irAlInicio();
      return;
    }
    void cargarPacientes();
  }, [avisar, cargarPacientes, cargando, desplazamiento, incluirArchivados, irAlInicio, paciente]);

  return { paciente, cargando, error, abrir, cerrar, confirmar };
}
