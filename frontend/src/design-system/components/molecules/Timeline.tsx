import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

/** Evento individual de una cronología. */
export interface TimelineItem {
  /** Identificador estable para la clave de la fila. */
  id: string;
  /** Título visible del evento. */
  title: ReactNode;
  /** Descripción opcional del evento. */
  description?: ReactNode;
  /** Texto de fecha/hora ya formateado. */
  timestamp?: string;
  /** Valor ISO opcional para el atributo `datetime`. */
  dateTime?: string;
  /** Tono opcional del marcador; predeterminado `neutral`. */
  tone?: BadgeTone;
}

/** Eventos y nombre accesible de una cronología ordenada. */
export interface TimelineProps {
  /** Eventos en el orden que se deben presentar. */
  items: TimelineItem[];
  /** Nombre accesible de la lista. */
  label: string;
  /** Clases adicionales para la lista. */
  className?: string;
}

/**
 * Lista cronológica de eventos en orden de presentación.
 *
 * ## Cuándo usarlo
 * Para mostrar una secuencia de eventos con fechas y contexto.
 * ## Cuándo no usarlo
 * No usarlo para elementos que deban ordenarse o modificarse dentro del componente.
 * ## Anatomía
 * - Lista ordenada; marcador decorativo; título, descripción y hora opcionales por evento.
 * ## Accesibilidad
 * Usa `<ol aria-label>` y `<li>`; marcadores y conectores usan `aria-hidden="true"`. Las fechas se representan con `<time datetime>` cuando se proporciona `dateTime`; no hay controles de teclado.
 * ## Responsive
 * Elementos apilados con texto de ancho mínimo cero; no declara cambios por viewport.
 */
export function Timeline({ items, label, className }: TimelineProps) {
  return (
    <ol aria-label={label} className={cn('flex flex-col', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
          {index < items.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[0.4375rem] top-4 bottom-0 w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden="true"
            className={cn(
              'relative mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-background',
              TONE_CLASSES[item.tone ?? 'neutral'].marker,
            )}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
            {item.timestamp ? (
              <time dateTime={item.dateTime} className="text-xs text-muted-foreground">
                {item.timestamp}
              </time>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
