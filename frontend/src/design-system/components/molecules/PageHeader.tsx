import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  /** Título principal que se renderiza como `h1`. */
  title: ReactNode;
  /** Descripción de la página. */
  description?: ReactNode;
  /** Texto breve sobre el título (p. ej. el área o el rol). */
  eyebrow?: ReactNode;
  /** Acciones de la página; se apilan bajo el título en pantallas estrechas. */
  actions?: ReactNode;
  /** Clases adicionales para el encabezado. */
  className?: string;
}

/**
 * Encabezado semántico para identificar una página y sus acciones principales.
 *
 * ## Cuándo usarlo
 * Al inicio de una página para presentar su título y contexto.
 * ## Cuándo no usarlo
 * No usarlo como encabezado de secciones internas ni para sustituir navegación.
 * ## Anatomía
 * - Eyebrow opcional, título `h1`, descripción opcional y acciones.
 * ## Accesibilidad
 * Usa `header` y un `h1`; el contenido textual se anuncia en orden DOM. Las acciones recibidas mantienen su foco y teclado.
 * ## Responsive
 * A 360 px título y acciones se apilan; desde `sm` (640 px) se colocan en fila, también a 768 y 1366 px.
 */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn('flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between', className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
