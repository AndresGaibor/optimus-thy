import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { ROLE_ICONS } from '../../lib/role-icons';
import { ROLE_CLASSES, ROLE_LABELS, type RoleKey } from '../../tones';

export interface RoleBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'role' | 'children'> {
  /** Rol clínico/administrativo a mostrar; el color nunca sustituye al texto. */
  role: RoleKey;
}

/**
 * Insignia de rol que acompaña el nombre con un icono decorativo.
 *
 * ## Cuándo usarlo
 * Para mostrar un rol dentro de una interfaz administrativa o clínica.
 * ## Cuándo no usarlo
 * No usarlo como único indicador cromático ni para indicar permisos concedidos.
 * ## Anatomía
 * - Icono decorativo y etiqueta textual localizada del rol.
 * ## Accesibilidad
 * El icono está oculto con `aria-hidden="true"` y la etiqueta visible aporta el nombre; no agrega rol, controles ni teclado.
 * ## Responsive
 * Se mantiene en línea sin saltos (`whitespace-nowrap`) en 360, 768 y 1366 px.
 */
export function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  const Icon = ROLE_ICONS[role];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        ROLE_CLASSES[role].soft,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      {ROLE_LABELS[role]}
    </span>
  );
}
