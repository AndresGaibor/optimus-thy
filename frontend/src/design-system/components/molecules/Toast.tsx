import { X } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { TONE_ICONS } from '../../lib/tone-icons';
import { TONE_CLASSES, type BadgeTone } from '../../tones';

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tono que determina el icono y el rol predeterminado; `neutral` por defecto. */
  tone?: BadgeTone;
  /** Título visible de la notificación. */
  title: ReactNode;
  /** Descripción opcional. */
  description?: ReactNode;
  /** Acción opcional (normalmente un `Button` pequeño). */
  action?: ReactNode;
  /** Si se pasa, muestra el botón de cierre. El componente no gestiona temporizadores ni pila. */
  onDismiss?: () => void;
  /** Nombre accesible del botón de cierre; predeterminado `Cerrar notificación`. */
  dismissLabel?: string;
}

/** Notificación puramente visual: quien la use decide cuándo montarla y desmontarla. */
/**
 * Notificación visual que el consumidor monta y desmonta.
 *
 * ## Cuándo usarlo
 * Para anunciar un cambio o mensaje breve mediante una región de estado.
 * ## Cuándo no usarlo
 * No usarlo como diálogo ni como gestor de temporizadores o una pila de notificaciones.
 * ## Anatomía
 * - Icono decorativo, título, descripción y acción/cierre opcionales.
 * ## Accesibilidad
 * El rol predeterminado es `status`, o `alert` para `danger`; el botón de cierre tiene `aria-label` y foco visible. Icono con `aria-hidden="true"`; el cierre opera con teclado nativo.
 * ## Responsive
 * Ocupa el ancho disponible hasta `max-w-sm`; el contenido de texto puede encogerse con `min-w-0` en 360, 768 y 1366 px.
 */
export function Toast({
  tone = 'neutral',
  title,
  description,
  action,
  onDismiss,
  dismissLabel = 'Cerrar notificación',
  className,
  role,
  ...props
}: ToastProps) {
  const Icon = TONE_ICONS[tone];
  const classes = TONE_CLASSES[tone];

  return (
    <div
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-card border bg-surface p-4 text-sm text-foreground shadow-lg',
        classes.surface,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', classes.text)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-semibold">{title}</p>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-border-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
