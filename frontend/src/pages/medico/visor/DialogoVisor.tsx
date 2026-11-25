import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useState } from 'react';
import type { ImagenCaso } from '../../../api/imagenes';
import { Button, Callout, Dialog, ImageViewer } from '../../../design-system';
import { ControlesVista } from './ControlesVista';
import { MetadatosImagen } from './MetadatosImagen';
import { formatearDimensiones, nombreDescarga } from './formato';

interface VistaImagenProps {
  /** Ecografía que se está examinando. */
  imagen: ImagenCaso;
}

/** Imagen, ajustes de vista y detección del fallo de carga de una ecografía. */
function VistaImagen({ imagen }: VistaImagenProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [brillo, setBrillo] = useState(100);
  const [contraste, setContraste] = useState(100);
  const [intento, setIntento] = useState(0);
  const [fallo, setFallo] = useState(false);
  const ajustadoAVentana = zoom === 1 && pan.x === 0 && pan.y === 0;
  const formato = imagen.formato.toUpperCase();
  const dimensiones = formatearDimensiones(imagen.ancho, imagen.alto);
  const alt =
    dimensiones === 'No disponible'
      ? `Ecografía ${formato}`
      : `Ecografía ${formato} de ${dimensiones}`;

  const reintentar = () => {
    setFallo(false);
    setIntento((actual) => actual + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      {fallo ? (
        <div className="flex flex-col gap-3">
          <Callout tone="danger" role="alert" title="No se pudo cargar la imagen">
            Comprueba la conexión y vuelve a intentarlo; el archivo original no se modifica.
          </Callout>
          <Button variant="outline" className="self-start" onClick={reintentar}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <ImageViewer
            src={imagen.url}
            alt={alt}
            caption="Vista de solo lectura: los ajustes no modifican el archivo original."
            analyzedRegion=""
            zoom={zoom}
            onZoomChange={setZoom}
            pan={pan}
            onPanChange={setPan}
            brightness={brillo / 100}
            contrast={contraste / 100}
          />
          <ControlesVista
            brillo={brillo}
            contraste={contraste}
            onBrilloChange={setBrillo}
            onContrasteChange={setContraste}
            onAjustarAVentana={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            ajustadoAVentana={ajustadoAVentana}
          />
        </>
      )}
      <img
        key={`${imagen.id}-${intento}`}
        src={imagen.url}
        alt=""
        aria-hidden="true"
        data-testid="visor-carga"
        className="sr-only"
        onError={() => setFallo(true)}
      />
    </div>
  );
}

export interface DialogoVisorProps {
  /** Ecografías del caso, en el orden de navegación. */
  imagenes: ImagenCaso[];
  /** Posición actual dentro de la lista. */
  indice: number;
  /** Controla la apertura del diálogo. */
  abierto: boolean;
  /** Notifica el cierre o la apertura. */
  onOpenChange: (abierto: boolean) => void;
  /** Notifica la nueva posición al navegar. */
  onIndiceChange: (indice: number) => void;
}

/** Diálogo del visor con navegación, ajustes de vista, metadatos y descarga (HU-061). */
export function DialogoVisor({
  imagenes,
  indice,
  abierto,
  onOpenChange,
  onIndiceChange,
}: DialogoVisorProps) {
  if (imagenes.length === 0) return null;

  const posicion = Math.min(Math.max(indice, 0), imagenes.length - 1);
  const imagen = imagenes[posicion]!;
  const total = imagenes.length;

  return (
    <Dialog
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title={`Imagen ${posicion + 1} de ${total}`}
      description="Ecografía del caso. Los ajustes de vista no modifican el archivo."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Imagen {posicion + 1} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIndiceChange(posicion - 1)}
              disabled={posicion === 0}
            >
              <ChevronLeft aria-hidden="true" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIndiceChange(posicion + 1)}
              disabled={posicion === total - 1}
            >
              Siguiente
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        <VistaImagen key={imagen.id} imagen={imagen} />
        <MetadatosImagen imagen={imagen} />
        <Button variant="outline" asChild className="self-start">
          <a href={imagen.url} download={nombreDescarga(imagen)}>
            <Download aria-hidden="true" />
            Descargar imagen
          </a>
        </Button>
      </div>
    </Dialog>
  );
}
