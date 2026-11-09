import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { TONE_ICONS } from '../../lib/tone-icons';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tono semántico que determina la superficie y el icono; predeterminado `info`. */
  tone?: BadgeTone;
  /** Título opcional del mensaje. */
  title?: ReactNode;
  /** Sustituye el icono por defecto del tono. */
  icon?: LucideIcon;
}

/**
 * Bloque visual para destacar un mensaje contextual con iconografía y tono.
 *
 * ## Cuándo usarlo
 * Para presentar información, avisos o alertas vinculados al contenido cercano.
 * ## Cuándo no usarlo
 * No usarlo como notificación temporal o como sustituto de un diálogo.
 * ## Anatomía
 * - Icono decorativo, título opcional y contenido.
 * ## Accesibilidad
 * Expone el `role` recibido, por defecto `note`; el icono tiene `aria-hidden="true"`. El texto forma el nombre/contenido anunciado; sin controles propios ni teclado.
 * ## Responsive
 * Conserva una fila de icono y contenido (`flex`); el texto puede ocupar el espacio disponible con `min-w-0`. No declara cambios por viewport.
 */
export function Callout({
  tone = 'info',
  title,
  icon,
  className,
  children,
  role = 'note',
  ...props
}: CalloutProps) {
  const Icon = icon ?? TONE_ICONS[tone];
  const classes = TONE_CLASSES[tone];

  return (
    <div
      role={role}
      className={cn(
        'flex gap-3 rounded-card border p-4 text-sm text-foreground',
        classes.surface,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', classes.text)} />
      <div className="flex min-w-0 flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-foreground/90">{children}</div> : null}
      </div>
    </div>
  );
}
