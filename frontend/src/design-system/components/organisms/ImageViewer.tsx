import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState, type PointerEvent } from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../atoms/Button';
import { Callout } from '../molecules/Callout';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

/** Desplazamiento horizontal y vertical controlado o interno del visor, en píxeles. */
export type ImageViewerPan = { x: number; y: number };

export type ImageViewerProps = {
  /** Clases adicionales para la figura. */
  className?: string;
  /** Zoom entre 0.5 y 2; inicialmente 1. */
  zoom?: number;
  /** Recibe cambios de zoom; si no se controla, el visor mantiene el estado. */
  onZoomChange?: (zoom: number) => void;
  /** Desplazamiento de la imagen; si no se controla, el visor mantiene el estado. */
  pan?: ImageViewerPan;
  /** Recibe cambios del desplazamiento. */
  onPanChange?: (pan: ImageViewerPan) => void;
  /** Intensidad de brillo aplicada solo a la vista (0–1, 1 = sin cambio); por defecto, 1. */
  brightness?: number;
  /** Intensidad de contraste aplicada solo a la vista (0–1, 1 = sin cambio); por defecto, 1. */
  contrast?: number;
} & (
  | { src: string; alt: string; caption: string; analyzedRegion: string }
  | {
      src?: undefined;
      alt?: undefined;
      caption?: string;
      analyzedRegion?: never;
    }
);

/**
 * ## Cuándo usarlo
 * Para examinar una imagen sintética con zoom y desplazamiento.
 * ## Cuándo no usarlo
 * No lo uses para presentar imágenes clínicas reales ni como herramienta de diagnóstico.
 * ## Anatomía
 * Figura con imagen opcional, región analizada, controles de zoom/restablecimiento y avisos.
 * ## Accesibilidad
 * La imagen usa el `alt` requerido; los controles son botones con nombre accesible. Zoom con controles y desplazamiento con puntero.
 * ## Responsive
 * El visor ocupa el ancho disponible sin breakpoints; a 360, 768 y 1366 px la imagen fluye dentro del contenedor.
 */
export function ImageViewer(props: ImageViewerProps) {
  const {
    caption,
    analyzedRegion,
    className,
    zoom: zoomProp,
    onZoomChange,
    pan: panProp,
    onPanChange,
    brightness = 1,
    contrast = 1,
  } = props;
  const src = 'src' in props ? props.src : undefined;
  const alt = 'alt' in props ? props.alt : undefined;
  const [zoomState, setZoomState] = useState(1);
  const [panState, setPanState] = useState<ImageViewerPan>({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; origin: ImageViewerPan } | null>(null);
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomProp ?? zoomState));
  const pan = panProp ?? panState;
  const hasImage = Boolean(src);

  const applyZoom = (next: number) => {
    const value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    if (zoomProp === undefined) setZoomState(value);
    onZoomChange?.(value);
  };
  const applyPan = (next: ImageViewerPan) => {
    if (panProp === undefined) setPanState(next);
    onPanChange?.(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasImage) return;
    dragRef.current = { x: event.clientX, y: event.clientY, origin: pan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    applyPan({
      x: drag.origin.x + event.clientX - drag.x,
      y: drag.origin.y + event.clientY - drag.y,
    });
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      {hasImage ? (
        <>
          <div
            className="overflow-hidden rounded-card border border-border bg-surface-subtle"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="aspect-[4/3] w-full touch-none select-none object-contain transition-transform motion-reduce:transition-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                filter: `brightness(${brightness}) contrast(${contrast})`,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Controles de zoom" className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Alejar imagen"
                onClick={() => applyZoom(zoom - ZOOM_STEP)}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Acercar imagen"
                onClick={() => applyZoom(zoom + ZOOM_STEP)}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Restablecer zoom"
                onClick={() => {
                  applyZoom(1);
                  applyPan({ x: 0, y: 0 });
                }}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              >
                <RotateCcw aria-hidden="true" />
              </Button>
            </div>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              Ampliación: {Math.round(zoom * 100)} %
            </p>
          </div>
          {analyzedRegion ? (
            <Callout tone="info" title={`Región analizada: ${analyzedRegion}`} />
          ) : null}
        </>
      ) : (
        <div
          role="status"
          className="flex aspect-[4/3] items-center justify-center rounded-card border border-dashed border-border bg-surface-subtle p-6 text-center text-sm text-muted-foreground"
        >
          No hay una imagen disponible.
        </div>
      )}
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
