import { Check, ChevronUp, LogOut } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { ROLE_CLASSES, type RoleKey } from '../../tones';
import { RoleBadge } from './RoleBadge';

/** Área de trabajo disponible en el menú de perfil. */
export interface ProfileMenuOption {
  /** Área de trabajo; coincide con el rol de la sesión. */
  value: RoleKey;
  /** Etiqueta visible del área. */
  label: string;
}

export interface ProfileMenuProps {
  /** Nombre completo de la cuenta; se muestran sus iniciales en el avatar. */
  nombre: string;
  /** Rol activo que se muestra y se marca en el panel. */
  rolActivo: RoleKey;
  /** Áreas disponibles para la cuenta (incluye la activa). */
  opciones: ProfileMenuOption[];
  /** Cambia el área de trabajo; la aplicación valida permisos en el servidor. */
  onCambiarRol: (valor: RoleKey) => void | Promise<void>;
  /** Cierra la sesión. */
  onCerrarSesion: () => void | Promise<void>;
  /** Título del selector dentro del panel. */
  etiquetaCambio?: string;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const letras = partes.slice(0, 2).map((parte) => parte[0] ?? '');
  return letras.join('').toUpperCase();
}

/**
 * Control de perfil de la barra lateral con el cambio de área y el cierre de sesión.
 *
 * ## Cuándo usarlo
 * Para mostrar la cuenta y cambiar de área de trabajo en un marco autenticado, sin competir con la navegación principal.
 * ## Cuándo no usarlo
 * No lo uses para asignar permisos ni como menú de administración de usuarios; el rol activo lo valida el servidor.
 * ## Anatomía
 * - Fila compacta: avatar con iniciales, nombre, insignia del rol activo y chevron.
 * - Panel emergente: título, opciones de área con marca de selección y acción de cerrar sesión.
 * ## Accesibilidad
 * El disparador anuncia `aria-expanded` y controla el panel con `aria-controls`; cada área expone `aria-pressed`. Escape cierra y devuelve el foco al disparador; al abrir, el foco pasa a la primera área. Los íconos son decorativos.
 * ## Responsive
 * La fila ocupa el ancho de la barra (mínimo 56 px de alto). En móvil vive dentro del panel de navegación modal y mantiene las mismas acciones.
 */
export function ProfileMenu({
  nombre,
  rolActivo,
  opciones,
  onCambiarRol,
  onCerrarSesion,
  etiquetaCambio = 'Cambiar área de trabajo',
}: ProfileMenuProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const tituloId = useId();

  useEffect(() => {
    if (!abierto) return;

    const alPulsarFuera = (evento: PointerEvent) => {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => document.removeEventListener('pointerdown', alPulsarFuera);
  }, [abierto]);

  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) disparadorRef.current?.focus();
  };

  return (
    <div
      ref={contenedorRef}
      className="relative"
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && abierto) {
          evento.stopPropagation();
          cerrar(true);
        }
      }}
    >
      <button
        ref={disparadorRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={panelId}
        onClick={() => setAbierto((previo) => !previo)}
        className="flex min-h-14 w-full items-center gap-3 rounded-control px-2 py-2 text-left transition-colors hover:bg-border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            ROLE_CLASSES[rolActivo].tint,
            ROLE_CLASSES[rolActivo].text,
          )}
          aria-hidden="true"
        >
          {iniciales(nombre)}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium text-foreground" title={nombre}>
            {nombre}
          </span>
          <RoleBadge role={rolActivo} className="w-fit" />
        </span>
        <ChevronUp
          aria-hidden="true"
          className={cn(
            'ml-auto size-4 shrink-0 text-muted-foreground transition-transform',
            abierto ? 'rotate-0' : 'rotate-180',
          )}
        />
      </button>

      {abierto ? (
        <div
          ref={panelRef}
          id={panelId}
          role="group"
          aria-labelledby={tituloId}
          className="absolute bottom-full left-0 z-40 mb-2 max-h-[min(22rem,70vh)] w-full overflow-y-auto rounded-control border border-border bg-surface p-2 shadow-md"
        >
          <p
            id={tituloId}
            className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {etiquetaCambio}
          </p>
          <ul className="flex flex-col gap-1">
            {opciones.map((opcion) => {
              const activa = opcion.value === rolActivo;
              return (
                <li key={opcion.value}>
                  <button
                    type="button"
                    aria-pressed={activa}
                    onClick={() => {
                      cerrar(false);
                      if (!activa) void onCambiarRol(opcion.value);
                    }}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      activa
                        ? cn(ROLE_CLASSES[rolActivo].tint, ROLE_CLASSES[rolActivo].text)
                        : 'text-foreground hover:bg-border-subtle',
                    )}
                  >
                    <span className="flex-1">{opcion.label}</span>
                    {activa ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-2 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              cerrar(false);
              void onCerrarSesion();
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-border-subtle hover:text-danger focus-visible:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
