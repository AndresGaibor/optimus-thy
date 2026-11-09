import { CircleAlert } from 'lucide-react';
import { cloneElement, useId, type AriaAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Label } from '../atoms/Label';

/** Atributos mínimos que Field lee y añade al control hijo. */
type ControlProps = Pick<AriaAttributes, 'aria-describedby' | 'aria-invalid'> & {
  /** Identificador DOM preexistente opcional del control. */
  id?: string | undefined;
  /** Indica si el control requiere valor. */
  required?: boolean | undefined;
};

export interface FieldProps {
  /** Etiqueta visible asociada al control. */
  label: ReactNode;
  /** Un único control que recibe `id`, `aria-describedby` y `aria-invalid`. */
  children: ReactElement<ControlProps>;
  /** Texto de ayuda asociado al control. */
  hint?: ReactNode;
  /** Mensaje de error asociado al control. */
  error?: ReactNode;
  /** Marca el campo como obligatorio. */
  required?: boolean;
  /** Clases adicionales para el contenedor. */
  className?: string;
}

/**
 * Asocia una etiqueta, ayuda y error con un control de formulario.
 *
 * ## Cuándo usarlo
 * Para etiquetar un control y comunicar sus instrucciones o validación.
 * ## Cuándo no usarlo
 * No usarlo con varios controles en `children` ni para mostrar solo texto.
 * ## Anatomía
 * - Etiqueta; control clonado con id y descripción; ayuda o error opcionales.
 * ## Accesibilidad
 * La etiqueta enlaza mediante `htmlFor`; al control se propagan `aria-describedby` y `aria-invalid`, y `required` cuando corresponde. El error incluye icono decorativo; el control mantiene su teclado y foco.
 * ## Responsive
 * Se apila en columna con `gap-1.5`; no declara cambios por viewport.
 */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const generatedId = useId();
  const controlId = children.props.id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy =
    [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = cloneElement(children, {
    id: controlId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : children.props['aria-invalid'],
    ...(required ? { required: true } : {}),
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={controlId} requiredMark={Boolean(required)}>
        {label}
      </Label>
      {control}
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
