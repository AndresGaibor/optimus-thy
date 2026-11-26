import { useState } from 'react';
import {
  exportarDatosPaciente,
  type FormatoExportacionPaciente,
} from '../../api/exportacion-paciente';
import { usePermisosSesion } from '../../session/SessionContext';
import { Button, Select } from '../../design-system';

interface Props {
  pacienteId: string;
  deshabilitado?: boolean;
  onError: (mensaje: string | null) => void;
}

/** Formato y botón para descargar los datos del paciente, con permiso efectivo. */
export function ExportarPaciente({ pacienteId, deshabilitado = false, onError }: Props) {
  const [formato, setFormato] = useState<FormatoExportacionPaciente>('json');
  const [exportando, setExportando] = useState(false);
  const puedeExportar = usePermisosSesion().includes('paciente.leer');

  const exportar = async () => {
    setExportando(true);
    onError(null);
    try {
      await exportarDatosPaciente(pacienteId, formato);
    } catch {
      onError('No se pudieron exportar los datos del paciente.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <span>Formato de exportación</span>
        <Select
          aria-label="Formato de exportación"
          value={formato}
          onChange={(evento) => setFormato(evento.target.value as FormatoExportacionPaciente)}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </Select>
      </label>
      <Button
        disabled={!puedeExportar || deshabilitado}
        loading={exportando}
        onClick={() => void exportar()}
      >
        Exportar datos
      </Button>
    </>
  );
}
