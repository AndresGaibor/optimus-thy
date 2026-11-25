import { Button, EmptyState } from '../../../design-system';
import type { ImagenCaso } from '../../../api/imagenes';
import { GaleriaImagenes } from '../GaleriaImagenes';

interface PanelImagenesProps {
  /** Ecografías del caso seleccionado. */
  imagenes: ImagenCaso[];
  /** Imagen cuyo análisis está en curso. */
  analizando: string | null;
  /** Indica si el caso permite analizar imágenes. */
  puedeAnalizar: boolean;
  /** Abre el diálogo para cargar una ecografía. */
  onAbrirSubida: () => void;
  /** Solicita el análisis de una imagen. */
  onAnalizar: (imagen: ImagenCaso) => void;
}

/** Sección de ecografías con su acción de carga y la galería del caso. */
export function PanelImagenes({
  imagenes,
  analizando,
  puedeAnalizar,
  onAbrirSubida,
  onAnalizar,
}: PanelImagenesProps) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="ecografias-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ecografias-title" className="text-lg font-semibold">
          Ecografías
        </h2>
        {imagenes.length > 0 ? (
          <Button variant="outline" size="sm" onClick={onAbrirSubida}>
            Subir otra
          </Button>
        ) : null}
      </div>
      {imagenes.length === 0 ? (
        <EmptyState
          title="Sin ecografías"
          description="Sube una imagen PNG o JPEG para poder analizarla."
          action={<Button onClick={onAbrirSubida}>Subir ecografía</Button>}
        />
      ) : (
        <GaleriaImagenes
          imagenes={imagenes}
          analizando={analizando}
          puedeAnalizar={puedeAnalizar}
          onAnalizar={onAnalizar}
        />
      )}
    </section>
  );
}
