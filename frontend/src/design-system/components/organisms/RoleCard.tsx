import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { ROLE_ICONS } from '../../lib/role-icons';
import { ROLE_CLASSES, ROLE_LABELS, type RoleKey } from '../../tones';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';

export interface RoleCardProps {
  /** Perfil al que representa la tarjeta. */
  role: RoleKey;
  /** Descripción del perfil. */
  description: ReactNode;
  /** Capacidades del rol, mostradas como lista; por defecto, lista vacía. */
  highlights?: string[];
  /** Texto del botón de acción; debe incluir el rol (p. ej. “Entrar como Médico”). */
  actionLabel: string;
  /** Acción al activar el botón; si se omite, el botón no ejecuta acción. */
  onSelect?: () => void;
  /** Deshabilita el botón; por defecto, `false`. */
  disabled?: boolean;
  /** Clases adicionales para la tarjeta. */
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para presentar un perfil con sus capacidades y una acción de selección.
 * ## Cuándo no usarlo
 * No lo uses como control de permisos ni para cambiar el rol por sí solo.
 * ## Anatomía
 * Icono decorativo, nombre del rol, descripción, lista opcional de capacidades y botón.
 * ## Accesibilidad
 * El icono y las marcas usan `aria-hidden="true"`; el botón se nombra con `actionLabel` y usa `disabled` cuando corresponde. El botón participa en el orden de teclado.
 * ## Responsive
 * No hay clases por breakpoint: la tarjeta usa `h-full`, columna y botón `w-full`; ocupa el ancho disponible a 360, 768 y 1366 px.
 */
export function RoleCard({
  role,
  description,
  highlights = [],
  actionLabel,
  onSelect,
  disabled,
  className,
}: RoleCardProps) {
  const Icon = ROLE_ICONS[role];
  const classes = ROLE_CLASSES[role];

  return (
    <Card className={cn('flex h-full flex-col gap-4 p-6', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-12 items-center justify-center rounded-card',
          classes.tint,
          classes.text,
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{ROLE_LABELS[role]}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {highlights.length > 0 ? (
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', classes.text)} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}
      <Button
        variant="outline"
        className="w-full"
        disabled={disabled}
        {...(onSelect ? { onClick: onSelect } : {})}
      >
        {actionLabel}
      </Button>
    </Card>
  );
}
