import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/**
 * ## Cuándo usarlo
 * Para agrupar contenido relacionado en una superficie con borde y fondo.
 * ## Cuándo no usarlo
 * No lo uses solo para añadir un fondo sin necesidad de agrupar información.
 * ## Anatomía
 * - Contenido hijo; puede componerse con `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` y `CardFooter`.
 * ## Accesibilidad
 * Es un contenedor `<div>` sin rol ni foco propios; sus elementos hijos conservan su semántica y orden de lectura. No añade atributos `aria-*`.
 * ## Responsive
 * No tiene breakpoints ni tamaño propio; como bloque ocupa el ancho disponible a 360, 768 y 1366 px. El padding de sus subcomponentes es fijo (`p-6`).
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-surface text-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
});

/**
 * ## Cuándo usarlo
 * Para separar visualmente el encabezado y el contenido de una tarjeta.
 * ## Cuándo no usarlo
 * No lo uses como contenedor de contenido principal ni para aplicar semántica de encabezado.
 * ## Anatomía
 * - Primera sección de `Card`; agrupa normalmente `CardTitle` y `CardDescription`.
 * ## Accesibilidad
 * Renderiza un `<div>` sin rol ni foco propios y no añade atributos `aria-*`; el orden de lectura sigue el DOM.
 * ## Responsive
 * Usa `flex flex-col gap-1.5 p-6` sin breakpoints; conserva la disposición vertical a 360, 768 y 1366 px.
 */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
  },
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Nivel de encabezado; elegir según la jerarquía de la página. */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

/**
 * ## Cuándo usarlo
 * Para dar un título semántico a una tarjeta, eligiendo su nivel según la jerarquía de la página.
 * ## Cuándo no usarlo
 * No lo uses como texto decorativo ni elijas un nivel de encabezado solo por su tamaño visual.
 * ## Anatomía
 * - Encabezado de la tarjeta; normalmente se coloca dentro de `CardHeader`.
 * ## Accesibilidad
 * Renderiza el encabezado HTML indicado por `as` (por defecto, `<h3>`); no añade atributos `aria-*` ni foco.
 * ## Responsive
 * Usa tipografía `text-lg` sin breakpoints; el encabezado fluye con el ancho disponible a 360, 768 y 1366 px.
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { as: Component = 'h3', className, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={cn('text-lg font-semibold leading-tight tracking-tight', className)}
      {...props}
    />
  );
});

/**
 * ## Cuándo usarlo
 * Para añadir una descripción breve al encabezado de una tarjeta.
 * ## Cuándo no usarlo
 * No lo uses como título ni para contenido que requiera otra estructura semántica.
 * ## Anatomía
 * - Párrafo descriptivo, normalmente junto a `CardTitle` dentro de `CardHeader`.
 * ## Accesibilidad
 * Renderiza un `<p>`; no añade atributos `aria-*` ni foco y se lee en el orden del DOM.
 * ## Responsive
 * Usa `text-sm` sin breakpoints; el párrafo fluye según el ancho disponible a 360, 768 y 1366 px.
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
});

/**
 * ## Cuándo usarlo
 * Para colocar el contenido principal de una tarjeta.
 * ## Cuándo no usarlo
 * No lo uses para el encabezado ni las acciones finales de la tarjeta.
 * ## Anatomía
 * - Sección central de `Card`, normalmente después de `CardHeader` y antes de `CardFooter`.
 * ## Accesibilidad
 * Renderiza un `<div>` sin rol ni foco propios y no añade atributos `aria-*`; conserva la semántica de sus hijos.
 * ## Responsive
 * Usa `p-6 pt-0` sin breakpoints; el contenido fluye dentro del ancho disponible a 360, 768 y 1366 px.
 */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
  },
);

/**
 * ## Cuándo usarlo
 * Para agrupar acciones o información complementaria al final de una tarjeta.
 * ## Cuándo no usarlo
 * No lo uses para el contenido principal ni si no hay un bloque final que separar.
 * ## Anatomía
 * - Sección final de `Card`, normalmente después de `CardContent`.
 * ## Accesibilidad
 * Renderiza un `<div>` sin rol ni foco propios y no añade atributos `aria-*`; sus hijos mantienen su semántica.
 * ## Responsive
 * Usa `flex items-center gap-2 p-6 pt-0` sin breakpoints; mantiene el flujo horizontal a 360, 768 y 1366 px.
 */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('flex items-center gap-2 p-6 pt-0', className)} {...props} />
    );
  },
);
