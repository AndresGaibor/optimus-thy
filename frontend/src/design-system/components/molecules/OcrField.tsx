import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Badge } from '../atoms/Badge';
import { Input } from '../atoms/Input';
import { Progress } from '../atoms/Progress';
import { Field } from './Field';

/** Origen del valor que se muestra en el campo OCR. */
export type OcrSource = 'digitado' | 'ocr';

export interface OcrFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'type' | 'value'
> {
  /** Etiqueta visible del campo. */
  label: string;
  /** Valor actual del control. */
  value: string;
  /** Confianza de extracción entre 0 y 1. */
  confidence: number;
  /** Fuente que produjo el valor. */
  source: OcrSource;
  /** Error que se asocia al control. */
  error?: ReactNode;
  /** Indica procesamiento y deshabilita el control. Predeterminado `false`. */
  loading?: boolean;
  /** Clases adicionales para el contenedor. */
  containerClassName?: string;
}

/**
 * Presenta un control editable junto con la confianza y el origen de su valor.
 *
 * ## Cuándo usarlo
 * Para revisar y confirmar campos extraídos por OCR o digitados.
 * ## Cuándo no usarlo
 * No usarlo para valores sin confianza calculada ni para confirmar automáticamente contenido.
 * ## Anatomía
 * - Campo etiquetado, indicador de confianza, progreso, insignias de origen/confirmación y estado de carga opcional.
 * ## Accesibilidad
 * La etiqueta se vincula con el control; el progreso tiene nombre accesible; carga anuncia `role="status"` y el contenedor usa `aria-busy`. `loading` o `disabled` impide interacción con el campo.
 * ## Responsive
 * Disposición vertical y distintivos con `flex-wrap`; se conserva en 360, 768 y 1366 px.
 */
export function OcrField({
  label,
  value,
  confidence,
  source,
  error,
  loading = false,
  disabled = false,
  readOnly,
  onChange,
  id,
  className,
  containerClassName,
  ...inputProps
}: OcrFieldProps) {
  const normalizedConfidence = Math.min(Math.max(confidence, 0), 1);
  const inputDisabled = disabled || loading;

  return (
    <div aria-busy={loading || undefined} className={cn('flex flex-col gap-3', containerClassName)}>
      <Field label={label} error={error}>
        <Input
          {...inputProps}
          id={id}
          value={value}
          onChange={onChange}
          disabled={inputDisabled}
          readOnly={readOnly || !onChange}
          className={className}
        />
      </Field>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Confianza: {Math.round(normalizedConfidence * 100)} %
        </span>
        <Progress
          label={`Confianza del campo ${label}`}
          value={normalizedConfidence * 100}
          tone="info"
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone={source === 'ocr' ? 'info' : 'neutral'}>
            {source === 'ocr' ? 'Origen: OCR' : 'Origen: digitado'}
          </Badge>
          <Badge tone="warning">Pendiente de confirmación</Badge>
        </div>
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Procesando el texto extraído.
          </p>
        ) : null}
      </div>
    </div>
  );
}
