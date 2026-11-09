import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Clases compartidas por los controles de texto. El estado de error se expresa con `aria-invalid`. */
export const CONTROL_CLASSES =
  'w-full rounded-control border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

/** Propiedades HTML nativas del campo; `type` predeterminado: `text`. */
export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Contenido decorativo situado al inicio del campo y oculto al lector de pantalla. */
  startIcon?: ReactNode;
};

/**
 * ## Cuándo usarlo
 * Para campos de entrada de una sola línea, usando `type` según el dato requerido.
 * ## Cuándo no usarlo
 * No lo uses para texto multilínea; para ello usa `Textarea`.
 * ## Anatomía
 * - Campo nativo y, opcionalmente, un icono decorativo al inicio.
 * ## Accesibilidad
 * Conserva el rol y teclado del `<input>` nativo. El control necesita nombre accesible externo; el icono se oculta con `aria-hidden`. `aria-invalid` marca el error para tecnologías de asistencia.
 * ## Responsive
 * `w-full` ocupa el ancho disponible del contenedor a 360, 768 y 1366 px; no hay reglas por breakpoint.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', startIcon, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type={type}
      className={cn(
        CONTROL_CLASSES,
        'h-10 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        startIcon ? 'pl-10' : undefined,
        className,
      )}
      {...props}
    />
  );
  if (!startIcon) {
    return input;
  }
  return (
    <span className="relative">
      {input}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {startIcon}
      </span>
    </span>
  );
});
