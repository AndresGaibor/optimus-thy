import { Activity } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../atoms/Card';

const panelVariants = cva('flex w-full flex-col gap-6', {
  variants: {
    width: {
      default: 'max-w-md',
      lg: 'max-w-5xl',
    },
  },
  defaultVariants: { width: 'default' },
});

export interface AuthLayoutProps extends VariantProps<typeof panelVariants> {
  /** Título principal del panel. */
  title: ReactNode;
  /** Subtítulo bajo la marca; por defecto, «Sistema de Gestión de Datos Clínicos». */
  subtitle?: ReactNode;
  /** Descripción opcional bajo el título del panel. */
  description?: ReactNode;
  /** Formulario o contenido principal. */
  children: ReactNode;
  /** Pie bajo el contenido (enlaces de ayuda, avisos). */
  footer?: ReactNode;
  /** Cabecera opcional sobre el panel (p. ej. `PublicNav`). */
  header?: ReactNode;
  /** Ancho del panel: `default` (predeterminado) o `lg`. */
  width?: 'default' | 'lg' | null;
  /** Clases adicionales para el contenedor de página. */
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para estructurar páginas de acceso con marca, panel centrado y contenido opcional.
 * ## Cuándo no usarlo
 * No lo uses como marco de páginas autenticadas ni para administrar la sesión.
 * ## Anatomía
 * Cabecera opcional, `<main>`, marca decorativa, título, subtítulo, tarjeta con contenido y pie opcional.
 * ## Accesibilidad
 * Incluye un `<main>` y encabezados `<h1>` y `<h2>`; el icono tiene `aria-hidden="true"`. Los controles del contenido conservan su teclado y foco propios.
 * ## Responsive
 * A 360 y 768 px el panel ocupa el ancho disponible hasta `max-w-md`; con `width="lg"` puede crecer hasta `max-w-5xl`. A 1366 px mantiene el centrado y ese límite de ancho.
 */
export function AuthLayout({
  title,
  subtitle = 'Sistema de Gestión de Datos Clínicos',
  description,
  children,
  footer,
  header,
  width,
  className,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-gradient-to-br from-brand/10 via-surface to-surface-subtle text-foreground',
        className,
      )}
    >
      {header}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className={panelVariants({ width })}>
          <header className="flex flex-col items-center gap-2 text-center">
            <div className="flex justify-center">
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground"
              >
                <Activity className="size-8" />
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">OPTIMUS-THY</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </header>
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle as="h2">{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer ? (
              <CardFooter className="flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                {footer}
              </CardFooter>
            ) : null}
          </Card>
        </div>
      </main>
    </div>
  );
}
