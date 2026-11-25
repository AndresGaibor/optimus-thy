import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Bloque decorativo para anticipar la estructura del contenido en carga.
 *
 * ## Cuándo usarlo
 * Mientras llega contenido cuya forma ya se conoce y el hueco reservado evita saltos.
 *
 * ## Cuándo no usarlo
 * Para acciones puntuales (usar el `loading` del botón) ni como sustituto de un vacío
 * o de un error.
 *
 * ## Anatomía
 * Un `div` decorativo; el contenedor de la región anuncia la carga con `role="status"`
 * y un texto para lectores de pantalla.
 *
 * ## Accesibilidad
 * Siempre `aria-hidden`; la información la da la región que lo contiene.
 *
 * ## Responsive
 * Hereda el tamaño de su contenedor mediante `className` (alto y ancho).
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        'animate-pulse motion-reduce:animate-none rounded-control bg-surface-subtle',
        className,
      )}
    />
  );
}
