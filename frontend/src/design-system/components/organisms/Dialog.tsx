import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { useRef, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

const dialogContentVariants = cva(
  'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-panel border border-border bg-surface text-foreground shadow-xl focus:outline-none',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        wide: 'max-w-5xl',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export interface DialogProps extends VariantProps<typeof dialogContentVariants> {
  /** Controla la apertura del diálogo desde el componente padre. */
  open?: boolean;
  /** Estado inicial de apertura; por defecto, `false`. */
  defaultOpen?: boolean;
  /** Notifica al componente padre cuando cambia el estado de apertura. */
  onOpenChange?: (open: boolean) => void;
  /** Elemento que abre el diálogo; opcional si el estado es controlado. */
  trigger?: ReactElement;
  /** Contenido que da nombre al diálogo; es obligatorio. */
  title: ReactNode;
  /** Descripción accesible opcional del diálogo. */
  description?: ReactNode;
  /** Contenido principal opcional del diálogo. */
  children?: ReactNode;
  /** Acciones al pie (usar `DialogClose asChild` para cancelar). */
  footer?: ReactNode;
  /** Nombre accesible del control de cierre; por defecto, `Cerrar`. */
  closeLabel?: string;
  /** Clases adicionales para el contenedor del diálogo. */
  className?: string;
  /** Ancho del diálogo; por defecto, `default`. */
  size?: 'sm' | 'default' | 'lg' | 'wide' | null;
}

/** Cierra el diálogo; úselo con `asChild` sobre un `Button`. */
export const DialogClose = DialogPrimitive.Close;

/**
 * ## Cuándo usarlo
 * Para presentar contenido y acciones que requieren atención antes de volver a la página.
 * ## Cuándo no usarlo
 * No lo uses para avisos breves ni para contenido que deba permanecer siempre visible.
 * ## Anatomía
 * Disparador opcional, velo, título, descripción opcional, contenido desplazable, cierre y pie opcional.
 * ## Accesibilidad
 * Radix administra el diálogo modal y su nombre mediante el título; el botón de cierre usa `aria-label`. Conserva/restaura el foco y Escape cierra.
 * ## Responsive
 * El ancho es `calc(100% - 2rem)` con máximo dependiente de `size`; la altura se limita al viewport. Se adapta a 360, 768 y 1366 px.
 */
export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,

  description,
  size,

  children,
  footer,
  closeLabel = 'Cerrar',
  className,
}: DialogProps) {
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root
      {...(open !== undefined ? { open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <DialogPrimitive.Content
          onOpenAutoFocus={() => {
            if (trigger) return;
            const activeElement = document.activeElement;
            restoreFocusRef.current =
              activeElement instanceof HTMLElement && activeElement !== document.body
                ? activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            if (trigger) return;
            event.preventDefault();
            if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus();
          }}
          className={cn(dialogContentVariants({ size }), className)}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <DialogPrimitive.Title className="text-lg font-semibold leading-tight text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-border-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
          {footer ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
