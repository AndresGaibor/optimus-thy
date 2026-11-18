import { RotateCcw, Save } from 'lucide-react';
import {
  Button,
  Callout,
  Field,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../../design-system';
import type { MensajeCorreo } from './CorreoServidorForm';
import type { ModoPlantilla } from './usePlantillaCorreo';

const VARIABLES = [
  { clave: 'nombre', ejemplo: 'Ana Pérez' },
  { clave: 'enlace', ejemplo: '#' },
  { clave: 'expira_en', ejemplo: '30 minutos' },
];

const VARIABLES_HTML = VARIABLES.map((fila) => fila.clave);

/** Campos que componen el correo, en el orden en que se leen. */
const CAMPOS = [
  {
    clave: 'titulo',
    etiqueta: 'Encabezado',
    ayuda: 'El título grande del correo.',
    filas: 0,
  },
  {
    clave: 'mensaje',
    etiqueta: 'Mensaje',
    ayuda: 'Puedes usar {{nombre}} para saludar a quien lo recibe.',
    filas: 3,
  },
  {
    clave: 'boton',
    etiqueta: 'Texto del botón',
    ayuda: 'El botón lleva al enlace de recuperación; no hace falta pegarlo.',
    filas: 0,
  },
  {
    clave: 'nota',
    etiqueta: 'Nota del enlace',
    ayuda: 'Se muestra bajo el botón. {{expira_en}} se sustituye por la vigencia.',
    filas: 2,
  },
  {
    clave: 'pie',
    etiqueta: 'Pie',
    ayuda: 'Cierre del mensaje, por ejemplo qué hacer si no lo solicitó.',
    filas: 2,
  },
] as const;

/** Sustituye los marcadores por datos de ejemplo para una vista sin servidor. */
export function previa(texto: string): string {
  return texto.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_coincidencia, clave: string) => {
    const fila = VARIABLES.find((variable) => variable.clave === clave);
    return fila ? fila.ejemplo : '';
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
  modo: ModoPlantilla;
  campos: Record<string, string>;
  html: string;
  vista: { asunto: string; html: string } | null;
  vistaCargando: boolean;
  mensaje: MensajeCorreo | null;
  guardando: boolean;
  deFabrica: boolean;
  onAsunto: (asunto: string) => void;
  onModo: (modo: ModoPlantilla) => void;
  onCampo: (clave: string, valor: string) => void;
  onHtml: (html: string) => void;
  onGuardar: () => void;
  onRestaurar: () => void;
}

/**
 * Editor del correo de recuperación con dos formas de trabajo.
 *
 * ## Cuándo usarlo
 * En `/administrador/correo`, pestaña Plantilla, para cambiar el asunto y el cuerpo del correo.
 * ## Cuándo no usarlo
 * No sirve para cambiar el servidor SMTP ni para otras plantillas que no existan todavía.
 * ## Anatomía
 * Asunto, pestañas Diseño (cinco campos) y HTML, aviso de resultado, acciones y, a la derecha,
 * una maqueta de bandeja con la vista previa que compone el servidor.
 * ## Accesibilidad
 * Etiquetas visibles y ayudas asociadas a cada campo; el cambio de pestaña conserva el foco y la
 * vista previa es un iframe aislado con título.
 * ## Responsive
 * Una columna en móvil; editor y vista previa lado a lado desde `lg` (1024 px).
 */
export function CorreoPlantillaForm({
  asunto,
  modo,
  campos,
  html,
  vista,
  vistaCargando,
  mensaje,
  guardando,
  deFabrica,
  onAsunto,
  onModo,
  onCampo,
  onHtml,
  onGuardar,
  onRestaurar,
}: CorreoPlantillaFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <Field label="Asunto" hint="Lo que se lee en la bandeja antes de abrir el correo.">
          <Input value={asunto} onChange={(evento) => onAsunto(evento.target.value)} />
        </Field>

        <Tabs value={modo} onValueChange={(valor) => onModo(valor as ModoPlantilla)}>
          <TabsList>
            <TabsTrigger value="visual">Diseño</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="grid gap-4 pt-4">
            {CAMPOS.map((campo) => (
              <Field key={campo.clave} label={campo.etiqueta} hint={campo.ayuda}>
                {campo.filas > 0 ? (
                  <Textarea
                    rows={campo.filas}
                    value={campos[campo.clave] ?? ''}
                    onChange={(evento) => onCampo(campo.clave, evento.target.value)}
                  />
                ) : (
                  <Input
                    value={campos[campo.clave] ?? ''}
                    onChange={(evento) => onCampo(campo.clave, evento.target.value)}
                  />
                )}
              </Field>
            ))}
          </TabsContent>

          <TabsContent value="html" className="grid gap-4 pt-4">
            <Callout tone="info" title="HTML completo">
              <span className="font-mono text-xs">
                {VARIABLES.map((fila) => `{{${fila.clave}}}`).join(' · ')}
              </span>
            </Callout>
            <Field
              label="Contenido HTML"
              hint="Se envía tal cual. La vista previa usa el mismo renderizado que el envío."
            >
              <Textarea
                rows={16}
                value={html}
                onChange={(evento) => onHtml(evento.target.value)}
                className="font-mono text-xs"
              />
            </Field>
          </TabsContent>
        </Tabs>

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

      <aside className="h-fit lg:sticky lg:top-4">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="grid gap-1 border-b border-border px-4 py-3">
            <p className="text-sm font-medium">OPTIMUS-THY</p>
            <p className="text-xs text-muted-foreground">Vista previa con datos de ejemplo</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{vista?.asunto ?? asunto}</p>
          </div>
          <iframe
            title="Vista previa del correo"
            sandbox=""
            srcDoc={vista?.html ?? ''}
            className="h-128 w-full bg-white"
          />
        </div>
        {vistaCargando ? (
          <p role="status" className="mt-2 text-xs text-muted-foreground">
            Actualizando la vista previa…
          </p>
        ) : null}
      </aside>
    </div>
  );
}
