import { useState } from 'react';
import { exportarDataset, type FormatoExportacion } from '../../../api/datasets';
import { Button } from '../../../design-system/components/atoms/Button';
import { Select } from '../../../design-system/components/atoms/Select';
import { Callout } from '../../../design-system/components/molecules/Callout';
import { Field } from '../../../design-system/components/molecules/Field';

export interface BotonExportarProps {
  /** Identificador del dataset abierto. */
  datasetId: string;
  /** Nombre del conjunto, para el mensaje de confirmación. */
  nombre: string;
}

function descargarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  try {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.rel = 'noopener';
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * ## Cuándo usarlo
 * En el detalle de un dataset, para descargarlo con su ficha técnica (RF-INV-08).
 * ## Cuándo no usarlo
 * Fuera de un dataset ya creado; no crea conjuntos ni sustituye a la exportación de la bitácora.
 * ## Anatomía
 * - Selector de formato (CSV o JSON), botón «Exportar» y avisos de resultado.
 * ## Accesibilidad
 * El selector lleva etiqueta visible; el botón anuncia el progreso con `loading` y el
 * resultado se anuncia en un `Callout` con `role="status"` o `role="alert"`.
 * ## Responsive
 * Selector y botón se apilan en 360 px y comparten fila desde 768 px.
 */
export function BotonExportar({ datasetId, nombre }: BotonExportarProps) {
  const [formato, setFormato] = useState<FormatoExportacion>('csv');
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  async function exportar(): Promise<void> {
    setExportando(true);
    setError(null);
    setListo(null);
    const respuesta = await exportarDataset(datasetId, formato);
    setExportando(false);
    if (!respuesta.ok) {
      setError(respuesta.error);
      return;
    }
    descargarArchivo(respuesta.data.contenido, respuesta.data.nombre);
    setListo(`Exportación lista: ${nombre} (${formato.toUpperCase()}).`);
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Formato de exportación" className="w-40">
          <Select
            value={formato}
            onChange={(evento) => setFormato(evento.target.value as FormatoExportacion)}
            disabled={exportando}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </Select>
        </Field>
        <Button onClick={() => void exportar()} loading={exportando} variant="secondary" size="sm">
          Exportar
        </Button>
      </div>
      {error ? (
        <div className="mt-2">
          <Callout tone="danger" role="alert">
            {error}
          </Callout>
        </div>
      ) : null}
      {listo ? (
        <div className="mt-2">
          <Callout tone="success" role="status">
            {listo}
          </Callout>
        </div>
      ) : null}
    </div>
  );
}
