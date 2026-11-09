import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface EmptyStateProps {
  /** Título del mensaje vacío. */
  title: string;
  /** Explicación opcional del estado. */
  description?: ReactNode;
  /** Icono decorativo; predeterminado `Inbox`. */
  icon?: LucideIcon;
  /** Acción principal (normalmente un `Button`). */
  action?: ReactNode;
  /** Nivel del encabezado del título; predeterminado `h3`. */
  as?: 'h2' | 'h3' | 'h4';
  /** Clases adicionales de presentación. */
  className?: string;
}

/**
 * Mensaje visual que explica por qué una región no contiene elementos.
 *
 * ## Cuándo usarlo
 * Para comunicar una lista vacía y, si corresponde, ofrecer una acción.
 * ## Cuándo no usarlo
 * No usarlo para estados de carga, errores o denegaciones de acceso.
 * ## Anatomía
 * - Icono decorativo, encabezado, descripción opcional y acción opcional.
 * ## Accesibilidad
 * El título usa `h3` por defecto o el nivel indicado por `as`; el icono tiene `aria-hidden="true"`. La acción conserva el foco y teclado del elemento recibido.
 * ## Responsive
 * Contenido apilado y centrado con padding fluido; no declara variantes por viewport.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  as: Heading = 'h3',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface-subtle px-6 py-10 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-12 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground"
      >
        <Icon className="size-6" />
      </span>
      <Heading className="text-base font-semibold text-foreground">{title}</Heading>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
