import { Menu, X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { BrandMark } from '../atoms/BrandMark';
import { Button } from '../atoms/Button';

/** Enlace interno de la navegación pública. */
export interface PublicNavLink {
  /** Ruta interna de destino. */
  to: string;
  /** Texto visible del enlace. */
  label: string;
}

export interface PublicNavProps {
  /** Enlaces de navegación. */
  links: PublicNavLink[];
  /** Acciones al final (p. ej. enlace a inicio de sesión). */
  actions?: ReactNode;
  /** Ruta de inicio de la marca; por defecto, `/`. */
  homeTo?: string;
  /** Nombre accesible de la navegación; por defecto, «Navegación pública». */
  navLabel?: string;
  /** Etiqueta del control de apertura; predeterminada «Abrir menú». */
  menuLabel?: string;
  /** Etiqueta del control de cierre; predeterminada «Cerrar menú». */
  closeMenuLabel?: string;
  /** Clases adicionales para la cabecera. */
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para ofrecer navegación y acciones en páginas públicas.
 * ## Cuándo no usarlo
 * No lo uses como navegación lateral de páginas autenticadas.
 * ## Anatomía
 * Marca enlazada al inicio, botón de menú en móvil, enlaces y acciones opcionales.
 * ## Accesibilidad
 * Marca con `aria-label="OPTIMUS-THY, inicio"`, botón con `aria-expanded`, `aria-controls` y `aria-label`; Escape cierra y devuelve foco al botón. Los enlaces muestran foco visible.
 * ## Responsive
 * A 360 px el menú se abre en columna; a 768 y 1366 px se muestra en fila (`md:flex`, `md:flex-row`) y se oculta el botón (`md:hidden`). El contenedor usa `lg:px-8`.
 */

export function PublicNav({
  links,
  actions,
  homeTo = '/',
  navLabel = 'Navegación pública',
  menuLabel = 'Abrir menú',
  closeMenuLabel = 'Cerrar menú',
  className,
}: PublicNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  };

  return (
    <header
      onKeyDown={handleKeyDown}
      className={cn('border-b border-border bg-background', className)}
    >
      <div className="mx-auto flex w-full max-w-(--content-max-width) flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 lg:px-8">
        <Link
          to={homeTo}
          aria-label="OPTIMUS-THY, inicio"
          className="rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <BrandMark />
        </Link>
        <Button
          ref={toggleRef}
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? closeMenuLabel : menuLabel}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
        <div
          id={panelId}
          className={cn(
            'w-full flex-col gap-4 md:flex md:w-auto md:flex-row md:items-center md:gap-6',
            open ? 'flex' : 'hidden',
          )}
        >
          <nav aria-label={navLabel}>
            <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        isActive
                          ? 'text-brand'
                          : 'text-muted-foreground hover:bg-border-subtle hover:text-foreground',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}
