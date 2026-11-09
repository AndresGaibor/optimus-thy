import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const markVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-control bg-brand text-brand-foreground',
  {
    variants: {
      /** Tamaño del símbolo: sm, default o lg (predeterminado: default). */
      size: {
        sm: 'size-7 [&>svg]:size-4',
        default: 'size-9 [&>svg]:size-5',
        lg: 'size-12 [&>svg]:size-7',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

/** Propiedades del símbolo de marca. */
export interface BrandMarkProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>, VariantProps<typeof markVariants> {
  /** Muestra el nombre “OPTIMUS-THY” junto al símbolo; predeterminado: `true`. Sin él, el símbolo lleva nombre accesible. */
  showWordmark?: boolean;
}

/**
 * ## Cuándo usarlo
 * Para identificar visualmente la marca con su símbolo y, de forma predeterminada, el nombre.
 * ## Cuándo no usarlo
 * No lo uses para sustituir una etiqueta de navegación o presentar el logotipo en otros colores.
 * ## Anatomía
 * - Símbolo SVG y, si `showWordmark` es verdadero, el texto OPTIMUS-THY.
 * ## Accesibilidad
 * Con el nombre visible, el símbolo se oculta con `aria-hidden`; sin él, tiene `role="img"` y `aria-label="OPTIMUS-THY"`. No es interactivo ni recibe foco.
 * ## Responsive
 * No tiene breakpoints; el símbolo mantiene el tamaño elegido (`sm`, `default` o `lg`) a 360, 768 y 1366 px, y el conjunto conserva su disposición en línea.
 */
export function BrandMark({ size, showWordmark = true, className, ...props }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} {...props}>
      <span
        className={markVariants({ size })}
        {...(showWordmark ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'OPTIMUS-THY' })}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <ellipse cx="7.5" cy="12" rx="3.5" ry="6.5" />
          <ellipse cx="16.5" cy="12" rx="3.5" ry="6.5" />
          <rect x="8" y="10.5" width="8" height="3" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-base font-bold tracking-tight text-foreground">OPTIMUS-THY</span>
      ) : null}
    </span>
  );
}
