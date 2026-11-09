import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { BrandMark } from '../atoms/BrandMark';

/** Enlace interno que se muestra en la navegación del pie público. */
export interface PublicFooterLink {
  /** Ruta de destino del enlace. */
  to: string;
  /** Texto visible del enlace. */
  label: string;
}

export interface PublicFooterProps {
  /** Descripción junto a la marca; predeterminada si se omite. */
  description?: ReactNode;
  /** Enlaces internos; por defecto, lista vacía. */
  links?: PublicFooterLink[];
  /** Nota legal o aviso; por defecto, nota institucional del proyecto. */
  note?: ReactNode;
  /** Nombre accesible de la navegación; por defecto, «Pie de página». */
  navLabel?: string;
  /** Clases adicionales para el pie. */
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para cerrar páginas públicas con identidad, descripción, enlaces y nota.
 * ## Cuándo no usarlo
 * No lo uses como navegación principal ni para contenido de sesión autenticada.
 * ## Anatomía
 * Marca y descripción, navegación opcional y nota legal opcional.
 * ## Accesibilidad
 * El pie usa `<footer>` y sus enlaces se agrupan en `<nav aria-label={navLabel}>`; los enlaces conservan foco visible.
 * ## Responsive
 * A 360 px los bloques se apilan y enlaces forman columna; desde 768 px se alinean en fila (`md:flex-row`). A 1366 px el ancho se limita con `max-w-(--content-max-width)` y `lg:px-8`.
 */

export function PublicFooter({
  description = 'Herramienta de apoyo a la gestión clínica relacionada con cáncer de tiroides.',
  links = [],
  note = 'OPTIMUS-THY — ESPOCH · Proyecto de Tesis 2024-2026',
  navLabel = 'Pie de página',
  className,
}: PublicFooterProps) {
  return (
    <footer className={cn('border-t border-border bg-surface-subtle', className)}>
      <div className="mx-auto flex w-full max-w-(--content-max-width) flex-col gap-6 px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-md flex-col gap-2">
            <BrandMark />
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {links.length > 0 ? (
            <nav aria-label={navLabel}>
              <ul className="flex flex-col gap-2 text-sm md:flex-row md:gap-6">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="rounded-control text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
        {note ? (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </footer>
  );
}
