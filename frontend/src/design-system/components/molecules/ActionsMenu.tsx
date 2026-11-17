import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

/** Acción seleccionable del menú. */
export interface ActionsMenuItem {
  /** Etiqueta visible y nombre accesible. */
  label: string;
  /** Ejecuta la acción y cierra el menú. */
  onSelect: () => void;
  /** Tono visual; `danger` se reserva para acciones destructivas. */
  tone?: 'default' | 'danger';
  /** Deshabilita la acción sin cerrar el menú. */
  disabled?: boolean;
  /** Explicación del estado deshabilitado. */
  title?: string;
}

export interface ActionsMenuProps {
  /** Nombre accesible del disparador, p. ej. «Acciones de ana@ejemplo.test». */
  label: string;
  /** Acciones del menú, en orden. */
  items: ActionsMenuItem[];
  /** Deshabilita el disparador (fila ocupada o sin permisos). */
  disabled?: boolean;
  /** Muestra un indicador de progreso junto al disparador. */
  busy?: boolean;
}

/**
 * Menú de acciones secundarias de una fila o tarjeta, con disparador de tres puntos.
 *
 * ## Cuándo usarlo
 * Para agrupar acciones de fila que no deben competir con la acción principal.
 * ## Cuándo no usarlo
 * No lo uses para la acción principal de una fila, para navegación global ni dentro de formularios.
 * ## Anatomía
 * - Disparador de icono con nombre accesible; panel en portal con `role="menu"` y un `menuitem` por acción.
 * ## Accesibilidad
 * El disparador anuncia `aria-haspopup` y `aria-expanded`; al abrir, el foco pasa al primer ítem y se mueve con flechas, Inicio y Fin. Escape y Tab cierran y devuelven el foco al disparador; cada acción cierra el menú.
 * ## Responsive
 * El panel se posiciona junto al disparador y se mantiene dentro del viewport desde 360 px; no cambia por breakpoint.
 */
export function ActionsMenu({ label, items, disabled = false, busy = false }: ActionsMenuProps) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null);
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    setPosicion(null);
    if (devolverFoco) disparadorRef.current?.focus();
  };

  const abrir = () => {
    const rect = disparadorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ancho = 208;
    setPosicion({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - ancho, window.innerWidth - ancho - 8)),
    });
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;
    const alPulsarFuera = (evento: PointerEvent) => {
      const destino = evento.target as Node;
      if (!panelRef.current?.contains(destino) && !disparadorRef.current?.contains(destino)) {
        cerrar(false);
      }
    };
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => document.removeEventListener('pointerdown', alPulsarFuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const primero = panelRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    primero?.focus();
  }, [abierto]);

  useEffect(() => {
    if (disabled) cerrar(false);
  }, [disabled]);

  const alTeclear = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    const botones = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
    switch (evento.key) {
      case 'Escape':
        evento.preventDefault();
        cerrar(true);
        return;
      case 'Tab':
        cerrar(true);
        return;
      case 'ArrowDown':
        evento.preventDefault();
        botones[(actual + 1) % botones.length]?.focus();
        return;
      case 'ArrowUp':
        evento.preventDefault();
        botones[(actual - 1 + botones.length) % botones.length]?.focus();
        return;
      case 'Home':
        evento.preventDefault();
        botones[0]?.focus();
        return;
      case 'End':
        evento.preventDefault();
        botones[botones.length - 1]?.focus();
        return;
      default:
        return;
    }
  };

  return (
    <div className="inline-flex">
      <button
        ref={disparadorRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? panelId : undefined}
        aria-label={label}
        aria-busy={busy || undefined}
        disabled={disabled}
        onClick={() => (abierto ? cerrar(true) : abrir())}
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowDown' || evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            if (!abierto) abrir();
          }
          if (evento.key === 'Escape' && abierto) cerrar(true);
        }}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition-colors',
          'hover:bg-surface-subtle hover:text-foreground',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          abierto && 'bg-surface-subtle text-foreground',
        )}
      >
        {busy ? (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          <MoreHorizontal aria-hidden="true" className="size-4" />
        )}
      </button>

      {abierto && posicion
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="menu"
              aria-label={label}
              onKeyDown={alTeclear}
              style={{ top: posicion.top, left: posicion.left }}
              className="fixed z-50 flex w-52 flex-col gap-0.5 rounded-control border border-border bg-surface p-1"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  title={item.title}
                  onClick={() => {
                    cerrar(true);
                    item.onSelect();
                  }}
                  className={cn(
                    'flex min-h-9 w-full items-center rounded-control px-2 text-left text-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    item.tone === 'danger'
                      ? 'text-danger hover:bg-surface-subtle focus-visible:text-danger'
                      : 'text-foreground hover:bg-surface-subtle',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
