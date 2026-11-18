import { useRef } from 'react';
import { Button, Field, Input, Textarea } from '../../design-system';
import { avisoMarcador, previa, VARIABLES, type CampoPlantilla } from './plantilla-marcadores';

export interface CorreoCampoPlantillaProps {
  campo: CampoPlantilla;
  valor: string;
  onCambio: (valor: string) => void;
}

/**
 * Un campo del correo en modo Diseño, con sus botones de marcador.
 *
 * ## Cuándo usarlo
 * Dentro del editor de la plantilla, una vez por cada campo de `CAMPOS`.
 * ## Cuándo no usarlo
 * No sirve para campos con HTML libre ni fuera del editor de la plantilla.
 * ## Anatomía
 * Etiqueta y ayuda, control de una o varias líneas, botones «Añadir …» que insertan el marcador
 * donde está el cursor, una línea con el resultado de ejemplo y el aviso de marcador mal escrito.
 * ## Accesibilidad
 * La etiqueta es la del sistema de diseño; al insertar, el foco vuelve al campo y el cursor queda
 * detrás del marcador; el aviso se anuncia con `role="status"`.
 * ## Responsive
 * Ocupa el ancho disponible; los botones se envuelven en móvil.
 */
export function CorreoCampoPlantilla({ campo, valor, onCambio }: CorreoCampoPlantillaProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const aviso = avisoMarcador(valor);

  /** Inserta el marcador donde está el cursor, no al final del texto. */
  const insertar = (variable: string) => {
    const nodo = ref.current;
    const marcador = `{{${variable}}}`;
    // Sin foco no hay cursor: se añade al final, que es lo que espera quien escribe.
    const enfocado = nodo !== null && document.activeElement === nodo;
    const inicio = enfocado ? (nodo?.selectionStart ?? valor.length) : valor.length;
    const fin = enfocado ? (nodo?.selectionEnd ?? valor.length) : valor.length;
    onCambio(valor.slice(0, inicio) + marcador + valor.slice(fin));
    if (nodo) {
      requestAnimationFrame(() => {
        nodo.focus();
        nodo.setSelectionRange(inicio + marcador.length, inicio + marcador.length);
      });
    }
  };

  return (
    <div className="grid gap-1">
      <Field label={campo.etiqueta} hint={campo.ayuda}>
        {campo.filas > 0 ? (
          <Textarea
            rows={campo.filas}
            value={valor}
            ref={(nodo) => {
              ref.current = nodo;
            }}
            onChange={(evento) => onCambio(evento.target.value)}
          />
        ) : (
          <Input
            value={valor}
            ref={(nodo) => {
              ref.current = nodo;
            }}
            onChange={(evento) => onCambio(evento.target.value)}
          />
        )}
      </Field>

      {campo.variables.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {campo.variables.map((variable) => {
            const fila = VARIABLES.find((item) => item.clave === variable);
            return (
              <Button
                key={variable}
                variant="outline"
                size="sm"
                aria-label={`Añadir ${fila?.etiqueta.toLowerCase() ?? variable} en ${campo.etiqueta}`}
                onClick={() => insertar(variable)}
              >
                Añadir {fila?.etiqueta.toLowerCase() ?? variable}
              </Button>
            );
          })}
        </div>
      ) : null}

      {valor.includes('{{') ? (
        <p className="text-xs text-muted-foreground">Así se verá: {previa(valor)}</p>
      ) : null}

      {aviso ? (
        <p role="status" className="text-sm text-danger">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
