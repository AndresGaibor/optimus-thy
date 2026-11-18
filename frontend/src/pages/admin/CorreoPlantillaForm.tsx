import { RotateCcw, Save, Send } from 'lucide-react';
import {
  Button,
  Callout,
  Field,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../../design-system';
import type { MensajeCorreo } from './CorreoServidorForm';
import type { ModoPlantilla } from './usePlantillaCorreo';
import { CorreoCampoPlantilla } from './CorreoCampoPlantilla';
import { CorreoVistaPrevia } from './CorreoVistaPrevia';
import { ASUNTO_CAMPO, CAMPOS, VARIABLES } from './plantilla-marcadores';

export interface CorreoPlantillaFormProps {
  asunto: string;
  modo: ModoPlantilla;
  campos: Record<string, string>;
  html: string;
  vista: { asunto: string; html: string } | null;
  vistaCargando: boolean;
  mensaje: MensajeCorreo | null;
  guardando: boolean;
  probando: boolean;
  deFabrica: boolean;
  sinGuardar: boolean;
  onAsunto: (asunto: string) => void;
  onModo: (modo: ModoPlantilla) => void;
  onCampo: (clave: string, valor: string) => void;
  onHtml: (html: string) => void;
  onGuardar: () => void;
  onProbar: () => void;
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
 * Asunto, pestañas Diseño (campos con marcadores) y HTML, aviso de resultado, acciones y, a la
 * derecha, la maqueta de bandeja con la vista previa que compone el servidor.
 * ## Accesibilidad
 * Etiquetas visibles y ayudas asociadas a cada campo; el aviso del resultado se anuncia con
 * `role="status"`; la vista previa es un `iframe` aislado con título.
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
  probando,
  deFabrica,
  sinGuardar,
  onAsunto,
  onModo,
  onCampo,
  onHtml,
  onGuardar,
  onProbar,
  onRestaurar,
}: CorreoPlantillaFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4">
        <CorreoCampoPlantilla campo={ASUNTO_CAMPO} valor={asunto} onCambio={onAsunto} />

        <Tabs value={modo} onValueChange={(valor) => onModo(valor as ModoPlantilla)}>
          <TabsList>
            <TabsTrigger value="visual">Diseño</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="grid gap-4 pt-4">
            {CAMPOS.map((campo) => (
              <CorreoCampoPlantilla
                key={campo.clave}
                campo={campo}
                valor={campos[campo.clave] ?? ''}
                onCambio={(valor) => onCampo(campo.clave, valor)}
              />
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
          {sinGuardar ? (
            <span className="text-sm text-muted-foreground">Cambios sin guardar</span>
          ) : null}
          <Button onClick={onGuardar} disabled={guardando || !sinGuardar}>
            <Save aria-hidden="true" className="size-4" />
            Guardar plantilla
          </Button>
          <Button variant="outline" onClick={onProbar} disabled={probando}>
            <Send aria-hidden="true" className="size-4" />
            Enviar prueba con esta plantilla
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

      <CorreoVistaPrevia asunto={asunto} vista={vista} cargando={vistaCargando} />
    </div>
  );
}
