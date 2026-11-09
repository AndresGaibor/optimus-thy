import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

/** Sistema de coordenadas de las marcas: ancho 0–100, alto 0–75. */
const SCAN_VIEWPORT_WIDTH = 100;
const SCAN_VIEWPORT_HEIGHT = 75;

/** Marca SVG sintética con etiqueta visible y coordenadas sobre la figura. */
export interface ScanOverlay {
  /** Identificador estable para la lista y la marca. */
  id: string;
  /** Texto de la marca; se muestra en el SVG y en la leyenda accesible. */
  label: string;
  /** Geometría rectangular o elíptica; por defecto, `rect`. */
  shape?: 'rect' | 'ellipse';
  /** Coordenada horizontal en el sistema 0–100. */
  x: number;
  /** Coordenada vertical en el sistema 0–75. */
  y: number;
  /** Ancho de la marca en el sistema SVG. */
  width: number;
  /** Alto de la marca en el sistema SVG. */
  height: number;
  /** Tono de la marca; por defecto, `info`. */
  tone?: BadgeTone;
}

/** Propiedades de la marca individual, renderizada dentro de un SVG. */
export interface ResultOverlayProps {
  /** Datos geométricos y etiqueta de la marca. */
  overlay: ScanOverlay;
}

/**
 * ## Cuándo usarlo
 * Para dibujar una marca geométrica sintética con etiqueta dentro de `ScanViewport`.
 * ## Cuándo no usarlo
 * No lo uses fuera del SVG del visor ni para representar hallazgos en imágenes clínicas reales.
 * ## Anatomía
 * - Grupo SVG con una figura `<rect>` o `<ellipse>` y un texto con la etiqueta.
 * ## Accesibilidad
 * El texto SVG muestra `overlay.label`; la etiqueta también se presenta en la leyenda accesible del `ScanViewport`. No añade atributos `aria-*`.
 * ## Responsive
 * La marca usa coordenadas del sistema SVG 0–100 × 0–75 y acompaña el `viewBox` escalable del visor, sin clases de breakpoint propias.
 */
export function ResultOverlay({ overlay }: ResultOverlayProps) {
  const { label, shape = 'rect', x, y, width, height, tone = 'info' } = overlay;
  const classes = TONE_CLASSES[tone];
  const shapeClasses = cn(classes.stroke, classes.areaFill);

  return (
    <g>
      {shape === 'ellipse' ? (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          strokeWidth={0.6}
          className={shapeClasses}
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={0.8}
          strokeWidth={0.6}
          className={shapeClasses}
        />
      )}
      <text x={x} y={Math.max(y - 1.2, 3)} fontSize={2.8} fontWeight={600} className={classes.fill}>
        {label}
      </text>
    </g>
  );
}

const GRID_STEPS = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];

export interface ScanViewportProps {
  /** Descripción accesible de la figura. */
  label: string;
  /** Marcas sintéticas mostradas en la figura; por defecto, lista vacía. */
  overlays?: ScanOverlay[];
  /** Permite al llamador ocultar las marcas (p. ej. con un interruptor). */
  showOverlays?: boolean;
  /** Aviso visible de que la figura es ilustrativa. */
  note?: ReactNode;
  /** Nombre accesible de la leyenda; por defecto, `Marcas del visor`. */
  legendLabel?: string;
  /** Clases adicionales para la figura. */
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para ilustrar una exploración con geometría sintética y marcas etiquetadas.
 * ## Cuándo no usarlo
 * No lo uses como imagen clínica ni como evidencia diagnóstica.
 * ## Anatomía
 * Figura SVG con retícula, formas esquemáticas, marcas opcionales, leyenda y aviso.
 * ## Accesibilidad
 * El SVG usa `role="img"` y `aria-label={label}`; la leyenda usa `aria-label={legendLabel}` y repite las etiquetas. Los marcadores de color tienen `aria-hidden="true"`.
 * ## Responsive
 * El SVG mantiene `aspect-[4/3]` y `w-full`, adaptándose a 360, 768 y 1366 px.
 */
export function ScanViewport({
  label,
  overlays = [],
  showOverlays = true,
  note = 'Ilustración sintética: no es una imagen clínica.',
  legendLabel = 'Marcas del visor',
  className,
}: ScanViewportProps) {
  const visible = showOverlays ? overlays : [];

  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${SCAN_VIEWPORT_WIDTH} ${SCAN_VIEWPORT_HEIGHT}`}
        className="aspect-[4/3] w-full rounded-card border border-border bg-surface-subtle"
      >
        {GRID_STEPS.map((step) => (
          <g key={step}>
            <line
              x1={step}
              y1={0}
              x2={step}
              y2={SCAN_VIEWPORT_HEIGHT}
              strokeWidth={0.2}
              className="stroke-border-subtle"
            />
            <line
              x1={0}
              y1={step * 0.75}
              x2={SCAN_VIEWPORT_WIDTH}
              y2={step * 0.75}
              strokeWidth={0.2}
              className="stroke-border-subtle"
            />
          </g>
        ))}
        <ellipse
          cx={50}
          cy={37.5}
          rx={32}
          ry={24}
          strokeWidth={0.4}
          className="fill-border-subtle stroke-border"
        />
        <ellipse
          cx={50}
          cy={37.5}
          rx={19}
          ry={14}
          strokeWidth={0.4}
          className="fill-surface stroke-border"
        />
        {visible.map((overlay) => (
          <ResultOverlay key={overlay.id} overlay={overlay} />
        ))}
      </svg>
      {visible.length > 0 ? (
        <ul aria-label={legendLabel} className="flex flex-wrap gap-2 text-xs">
          {visible.map((overlay) => (
            <li
              key={overlay.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-foreground"
            >
              <span
                aria-hidden="true"
                className={cn('size-2 rounded-full', TONE_CLASSES[overlay.tone ?? 'info'].marker)}
              />
              {overlay.label}
            </li>
          ))}
        </ul>
      ) : null}
      {note ? <figcaption className="text-xs text-muted-foreground">{note}</figcaption> : null}
    </figure>
  );
}
