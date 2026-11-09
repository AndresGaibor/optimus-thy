import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * ## Cuándo usarlo
 * Para organizar paneles de contenido relacionados en secciones seleccionables.
 * ## Cuándo no usarlo
 * No lo uses como sustituto de enlaces entre páginas o para controles de acción.
 * ## Anatomía
 * - Raíz `Tabs`, lista `TabsList`, disparadores `TabsTrigger` y paneles `TabsContent`.
 * ## Accesibilidad
 * `Tabs` delega en la API de Radix Tabs, que gestiona roles, relaciones, selección y teclado de pestañas. La lista necesita nombre accesible; los disparadores conservan foco visible mediante `focus-visible`.
 * ## Responsive
 * La lista usa `w-full overflow-x-auto`; a 360, 768 y 1366 px ocupa el contenedor y permite desplazamiento horizontal cuando las pestañas no caben.
 *
 * La API y props son las del primitivo `@radix-ui/react-tabs`; este componente no declara una interfaz propia.
 */
export const Tabs = TabsPrimitive.Root;
/**
 * ## Cuándo usarlo
 * Para agrupar visualmente pestañas que controlan paneles relacionados.
 * ## Cuándo no usarlo
 * No lo uses para agrupar acciones que no seleccionan paneles de pestañas.
 * ## Anatomía
 * - Lista de pestañas del conjunto `Tabs`; contiene `TabsTrigger`.
 * ## Accesibilidad
 * Renderiza `TabsPrimitive.List` de Radix con semántica de lista de pestañas; no añade atributos `aria-*` propios.
 * ## Responsive
 * Usa `flex w-full items-end gap-1 overflow-x-auto border-b`; a 360 px permite desplazamiento horizontal, y a 768/1366 px ocupa el contenedor.
 */
export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'flex w-full items-end gap-1 overflow-x-auto border-b border-border',
        className,
      )}
      {...props}
    />
  );
});

/**
 * ## Cuándo usarlo
 * Para ofrecer la selección de una pestaña dentro de `TabsList`.
 * ## Cuándo no usarlo
 * No lo uses como botón de acción ni sin un panel asociado.
 * ## Anatomía
 * - Disparador seleccionable dentro de `TabsList`, asociado a un `TabsContent`.
 * ## Accesibilidad
 * Renderiza `TabsPrimitive.Trigger`, que proporciona semántica y teclado de pestaña de Radix; conserva `focus-visible` y los estados `data-[state=active]` y `disabled:*`.
 * ## Responsive
 * Usa `shrink-0` y `whitespace-nowrap` con altura `h-11`; evita que la etiqueta se encoja a 360, 768 y 1366 px.
 */
export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        '-mb-px inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition-colors',
        'hover:text-foreground',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:border-brand data-[state=active]:text-brand',
        className,
      )}
      {...props}
    />
  );
});

/**
 * ## Cuándo usarlo
 * Para alojar el contenido mostrado por una pestaña seleccionada.
 * ## Cuándo no usarlo
 * No lo uses fuera de un conjunto `Tabs` ni para contenido independiente de la selección.
 * ## Anatomía
 * - Panel asociado a un `TabsTrigger` dentro de la raíz `Tabs`.
 * ## Accesibilidad
 * Renderiza `TabsPrimitive.Content`; Radix gestiona su relación y estado con el disparador. El estilo `focus-visible` muestra el foco; no añade `aria-*` propios.
 * ## Responsive
 * Usa `mt-4` y fluye con el ancho del contenedor sin breakpoints a 360, 768 y 1366 px.
 */
export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  );
});
