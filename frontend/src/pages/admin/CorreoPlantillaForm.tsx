import { RotateCcw, Save } from 'lucide-react';
import { Button, Callout, Field, Input, Textarea } from '../../design-system';
import type { MensajeCorreo } from './CorreoServidorForm';

const VARIABLES = [
  { clave: 'nombre', ejemplo: 'Ana Pérez' },
  { clave: 'enlace', ejemplo: '#' },
  { clave: 'expira_en', ejemplo: '30 minutos' },
];

const VARIABLES_HTML = VARIABLES.map((fila) => fila.clave);

/** Sustituye los marcadores por datos de ejemplo para la vista previa. */
export function previa(html: string): string {
  return html.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_coincidencia, clave: string) => {
    const variable = VARIABLES.find((fila) => fila.clave === clave);
    return variable ? variable.ejemplo : '';
  });
}

/** Devuelve el mensaje de error si la plantilla usa una variable inexistente. */
export function verificarVariables(texto: string): string | null {
  const usadas = [...texto.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((fila) => fila[1]);
  const desconocida = usadas.find((clave) => !VARIABLES_HTML.includes(clave ?? ''));
  return desconocida ? `La variable {{${desconocida}}} no existe.` : null;
}

export interface CorreoPlantillaFormProps {
  asunto: string;
  html: string;
  mensaje: MensajeCorreo | null;
  guardando: boolean;
  deFabrica: boolean;
  onAsunto: (asunto: string) => void;
  onHtml: (html: string) => void;
  onGuardar: () => void;
  onRestaurar: () => void;
}

/** Editor de la plantilla con vista previa aislada y restauración de fábrica. */
export function CorreoPlantillaForm({
  asunto,
  html,
  mensaje,
  guardando,
  deFabrica,
  onAsunto,
  onHtml,
  onGuardar,
  onRestaurar,
}: CorreoPlantillaFormProps) {
  return (
    <div className="grid gap-4">
      <Callout tone="info" title="Variables disponibles">
        <span className="font-mono text-xs">
          {VARIABLES.map((fila) => `{{${fila.clave}}}`).join(' · ')}
        </span>
      </Callout>

      <Field label="Asunto">
        <Input value={asunto} onChange={(evento) => onAsunto(evento.target.value)} />
      </Field>

      <Field label="Contenido HTML" hint="Se envía tal cual; la vista previa usa datos de ejemplo.">
        <Textarea
          rows={14}
          value={html}
          onChange={(evento) => onHtml(evento.target.value)}
          className="font-mono text-xs"
        />
      </Field>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Vista previa</span>
        <iframe
          title="Vista previa de la plantilla"
          sandbox=""
          srcDoc={previa(html)}
          className="h-80 w-full rounded-card border border-border bg-surface"
        />
      </div>

      {mensaje ? (
        <Callout tone={mensaje.tipo === 'ok' ? 'success' : 'danger'} role="status">
          {mensaje.texto}
        </Callout>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onGuardar} disabled={guardando}>
          <Save aria-hidden="true" className="size-4" />
          Guardar plantilla
        </Button>
        <Button variant="outline" onClick={onRestaurar} disabled={guardando || deFabrica}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Restaurar la de fábrica
        </Button>
        {deFabrica ? (
          <span className="text-sm text-muted-foreground">Usando la plantilla de fábrica.</span>
        ) : null}
      </div>
    </div>
  );
}
