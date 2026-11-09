import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Activity, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { ROLE_CLASSES, ROLE_LABELS, type RoleKey } from '../../tones';
import { BrandMark } from '../atoms/BrandMark';
import { Button } from '../atoms/Button';

/** Elemento de navegación del marco lateral. */
export interface SidebarNavItem {
  /** Ruta interna de destino. */
  to: string;
  /** Texto del enlace. */
  label: string;
  /** Icono opcional del elemento. */
  icon?: LucideIcon;
  /** Coincidencia exacta de ruta para el estado activo. */
  end?: boolean;
}

export interface SidebarLayoutProps {
  /** Elementos de la navegación. */
  navItems: SidebarNavItem[];
  /** Nombre accesible de la navegación; por defecto, «Navegación principal». */
  navLabel?: string;
  /** Identidad de la sesión (p. ej. `RoleBadge`); no la gestiona. */
  sessionInfo?: ReactNode;
  /** Acciones de sesión. */
  sessionActions?: ReactNode;
  /** Marca opcional; por defecto, `BrandMark`. */
  brand?: ReactNode;
  /** Texto del enlace para saltar al contenido; valor predeterminado «Saltar al contenido». */
  skipLinkLabel?: string;
  /** Nombre del botón que abre el menú móvil; valor predeterminado «Abrir menú». */
  menuLabel?: string;
  /** Nombre del botón que cierra el menú móvil; valor predeterminado «Cerrar menú». */
  closeMenuLabel?: string;
  /** `id` del `<main>`, destino del enlace de salto; por defecto, `contenido`. */
  mainId?: string;
  /** Tono de rol para la marca y el estado activo. */
  tone?: RoleKey | undefined;
  /** Etiqueta del rol mostrada bajo la marca. */
  roleLabel?: string | undefined;
  /** Acción de cambio de rol. */
  onRoleChange?: (() => void) | undefined;
  /** Etiqueta de la acción de cambio de rol; valor predeterminado en el botón. */
  roleChangeLabel?: string | undefined;
  /** Contenido de la página. */
  children: ReactNode;
}

interface SidebarBodyProps extends Pick<
  SidebarLayoutProps,
  | 'navItems'
  | 'navLabel'
  | 'sessionInfo'
  | 'sessionActions'
  | 'brand'
  | 'tone'
  | 'roleLabel'
  | 'onRoleChange'
  | 'roleChangeLabel'
> {
  onNavigate?: () => void;
}

function BrandBlock({ tone, roleLabel }: { tone: RoleKey; roleLabel?: string | undefined }) {
  if (!tone) return null;
  const classes = ROLE_CLASSES[tone];
  const label = roleLabel ?? ROLE_LABELS[tone];
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
          classes.solid,
        )}
        aria-hidden="true"
      >
        <Activity className="size-6" />
      </span>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground">OPTIMUS-THY</span>
        <span className={cn('text-xs font-medium', classes.text)}>{label}</span>
      </div>
    </div>
  );
}

function SidebarBody({
  navItems,
  navLabel,
  sessionInfo,
  sessionActions,
  brand,
  tone,
  roleLabel,
  onRoleChange,
  roleChangeLabel = 'Cambiar rol',
  onNavigate,
}: SidebarBodyProps) {
  const activeClass = tone
    ? cn(ROLE_CLASSES[tone].tint, ROLE_CLASSES[tone].text)
    : 'bg-brand/10 text-brand';
  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <div className="border-b border-border px-2 py-3">
        {tone ? <BrandBlock tone={tone} roleLabel={roleLabel} /> : (brand ?? <BrandMark />)}
      </div>
      <nav aria-label={navLabel} className="flex-1">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }, index) => (
            <li key={to || `nav-${index}`}>
              <NavLink
                to={to}
                {...(end !== undefined ? { end } : {})}
                {...(onNavigate ? { onClick: onNavigate } : {})}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    isActive
                      ? activeClass
                      : 'text-muted-foreground hover:bg-border-subtle hover:text-foreground',
                  )
                }
              >
                {Icon ? <Icon aria-hidden="true" className="size-5 shrink-0" /> : null}
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {sessionInfo ? <div className="text-sm text-muted-foreground">{sessionInfo}</div> : null}
        {onRoleChange ? (
          <button
            type="button"
            onClick={onRoleChange}
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            {roleChangeLabel}
          </button>
        ) : null}
        {sessionActions}
      </div>
    </div>
  );
}

/**
 * ## Cuándo usarlo
 * Para organizar páginas autenticadas con navegación lateral, sesión y contenido.
 * ## Cuándo no usarlo
 * No lo uses en páginas públicas ni para decidir permisos.
 * ## Anatomía
 * Enlace de salto, navegación lateral en escritorio, menú modal en móvil, cabecera y `<main>`.
 * ## Accesibilidad
 * El enlace de salto apunta al `<main id={mainId}>`; el menú móvil usa `aria-expanded` indirectamente vía Radix, `aria-label` en abrir/cerrar y título accesible. Escape/cierre restauran foco; los enlaces y botones son teclado operables.
 * ## Responsive
 * Menos de 64rem muestra cabecera y menú (`lg:hidden`); a 1366 px la barra fija aparece (`lg:block`) y el layout pasa a fila (`lg:flex-row`). Contenido fluye a 360/768 px.
 */
export function SidebarLayout({
  navItems,
  navLabel = 'Navegación principal',
  sessionInfo,
  sessionActions,
  brand = <BrandMark />,
  skipLinkLabel = 'Saltar al contenido',
  menuLabel = 'Abrir menú',
  closeMenuLabel = 'Cerrar menú',
  mainId = 'contenido',
  tone,
  roleLabel,
  onRoleChange,
  roleChangeLabel = 'Cambiar rol',
  children,
}: SidebarLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopSidebarRef = useRef<HTMLElement>(null);
  const isDesktopRef = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(min-width: 64rem)');
    const syncDesktopState = () => {
      isDesktopRef.current = mediaQuery.matches;
      if (mediaQuery.matches) setMenuOpen(false);
    };

    syncDesktopState();
    mediaQuery.addEventListener('change', syncDesktopState);
    return () => mediaQuery.removeEventListener('change', syncDesktopState);
  }, []);

  const bodyProps = {
    navItems,
    navLabel,
    sessionInfo,
    sessionActions,
    brand,
    tone,
    roleLabel,
    onRoleChange,
    roleChangeLabel,
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle text-foreground lg:flex-row">
      <nav aria-label="Navegación de salto" className="h-0">
        <a
          href={`#${mainId}`}
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          {skipLinkLabel}
        </a>
      </nav>

      <aside
        ref={desktopSidebarRef}
        tabIndex={-1}
        className="hidden w-64 shrink-0 border-r border-border bg-surface lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto"
      >
        <SidebarBody {...bodyProps} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-2 lg:hidden">
        <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogPrimitive.Trigger asChild>
            <Button variant="outline" size="icon" aria-label={menuLabel}>
              <Menu aria-hidden="true" />
            </Button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay
              className="fixed inset-0 z-50 bg-scrim lg:hidden motion-reduce:transition-none"
              aria-hidden="true"
            />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              onCloseAutoFocus={(event) => {
                if (!isDesktopRef.current) return;
                event.preventDefault();
                const firstNavLink =
                  desktopSidebarRef.current?.querySelector<HTMLElement>('nav a[href]');
                (firstNavLink ?? desktopSidebarRef.current)?.focus();
              }}
              className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] overflow-y-auto border-r border-border bg-surface text-foreground shadow-xl focus:outline-none lg:hidden motion-reduce:transition-none"
            >
              <DialogPrimitive.Title className="sr-only">{navLabel}</DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label={closeMenuLabel}
                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-border-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </DialogPrimitive.Close>
              <SidebarBody {...bodyProps} onNavigate={() => setMenuOpen(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        {tone ? <BrandBlock tone={tone} roleLabel={roleLabel} /> : brand}
      </header>

      <main id={mainId} tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
        <div className="mx-auto w-full max-w-(--content-max-width) space-y-6 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
