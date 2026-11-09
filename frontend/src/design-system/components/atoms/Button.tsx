import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-medium',
    'transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      /** Variante visual (predeterminada: `default`). */
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-danger text-danger-foreground hover:bg-danger/90',
        outline: 'border border-input bg-background text-foreground hover:bg-border-subtle',
        secondary: 'bg-border-subtle text-foreground hover:bg-border',
        ghost: 'text-foreground hover:bg-border-subtle',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      /** Tamaño de alto y padding (predeterminado: `default`). */
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

/** Props HTML nativas (`type` predeterminado: `button`) y variantes visuales del componente. */
type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

/** Propiedades del botón; sus variantes y tamaños usan los valores definidos en `buttonVariants`. */
export type ButtonProps = ButtonBaseProps &
  (
    | {
        /** Renderiza el hijo (p. ej. un enlace) con los estilos y atributos del botón. */
        asChild: true;
        /** Un enlace no tiene estado disabled nativo; omítalo al usar `asChild`. */
        disabled?: never;
        /** No se admite junto a `asChild`. */
        loading?: never;
      }
    | {
        /** No renderiza el hijo mediante Slot; predeterminado: `false`. */
        asChild?: false;
        /** Muestra un spinner, marca `aria-busy` y bloquea la activación. */
        loading?: boolean;
      }
  );

/**
 * ## Cuándo usarlo
 * Para acciones activables dentro de formularios o flujos de interfaz.
 * ## Cuándo no usarlo
 * No lo uses como enlace de navegación salvo que `asChild` delegue en un enlace real.
 * ## Anatomía
 * - Contenido hijo; opcionalmente un spinner mientras carga.
 * ## Accesibilidad
 * Renderiza un `<button>` nativo o compone el hijo con Radix Slot. Conserva el teclado y el foco nativo; `loading` añade `aria-busy` y deshabilita el botón. El texto del hijo es el nombre accesible.
 * ## Responsive
 * No tiene breakpoints; conserva la altura del tamaño elegido (`default` 40px, `sm` 36px, `lg` 44px, `icon` 40px) en 360, 768 y 1366 px.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, loading, children, disabled, type, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading ? true : undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});
