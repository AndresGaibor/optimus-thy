import { Upload } from 'lucide-react';
import { useId, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface FileDropzoneProps {
  /** Recibe los archivos elegidos o soltados. El componente no sube ni procesa nada. */
  onFiles: (files: File[]) => void;
  /** Mismo formato que el atributo `accept` de `input[type=file]`. */
  accept?: string;
  /** Permite seleccionar varios archivos; por defecto, `false`. */
  multiple?: boolean;
  /** Deshabilita selección y arrastre; por defecto, `false`. */
  disabled?: boolean;
  /** Etiqueta visible y asociada al selector; tiene un texto predeterminado. */
  label?: string;
  /** Ayuda asociada al selector. */
  hint?: ReactNode;
  /** Error asociado al selector y anunciado por el lector de pantalla. */
  error?: ReactNode;
  /** Identificador del selector; si se omite, se genera uno. */
  id?: string;
  /** Clases adicionales para el contenedor. */
  className?: string;
}

/** Aplica `accept` también a los archivos soltados, que el navegador no filtra por sí solo. */
function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * ## Cuándo usarlo
 * Para elegir o arrastrar archivos que otro componente procesará.
 * ## Cuándo no usarlo
 * No lo uses para subir o procesar archivos; solo entrega los archivos aceptados mediante `onFiles`.
 * ## Anatomía
 * Etiqueta de selección y arrastre, icono decorativo, ayuda y mensaje de error opcionales.
 * ## Accesibilidad
 * El `<label>` nombra el `input type="file"` mediante `htmlFor`; `aria-describedby` relaciona la ayuda y el error. La selección nativa conserva su teclado y foco.
 * ## Responsive
 * El contenedor usa una columna flexible sin reglas por breakpoint; fluye con el ancho disponible a 360, 768 y 1366 px.
 */

export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  label = 'Seleccionar archivos o arrastrarlos aquí',
  hint,
  error,
  id,
  className,
}: FileDropzoneProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const [dragging, setDragging] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const accepted = Array.from(event.target.files ?? []).filter((file) =>
      matchesAccept(file, accept),
    );
    const files = multiple ? accepted : accepted.slice(0, 1);
    // Permite volver a elegir el mismo archivo después de un cambio.
    event.target.value = '';
    if (files.length > 0) onFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const accepted = Array.from(event.dataTransfer.files).filter((file) =>
      matchesAccept(file, accept),
    );
    const files = multiple ? accepted : accepted.slice(0, 1);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors',
          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
          error ? 'border-danger' : 'border-input',
          dragging ? 'border-brand bg-brand/10' : 'bg-surface-subtle hover:bg-border-subtle',
          disabled ? 'cursor-not-allowed opacity-50 hover:bg-surface-subtle' : '',
        )}
      >
        <Upload aria-hidden="true" className="size-8 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint ? (
          <span id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
        <input
          id={inputId}
          type="file"
          className="sr-only"
          disabled={disabled}
          multiple={multiple}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...(accept ? { accept } : {})}
          onChange={handleChange}
        />
      </label>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
