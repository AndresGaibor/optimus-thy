export interface CorreoVistaPreviaProps {
  asunto: string;
  vista: { asunto: string; html: string } | null;
  cargando: boolean;
}

/**
 * Maqueta de bandeja con el correo tal como llegará.
 *
 * ## Cuándo usarlo
 * Junto al editor de la plantilla, para comprobar asunto y cuerpo antes de guardar.
 * ## Cuándo no usarlo
 * No sirve para previsualizar otros correos ni para enviar: el HTML lo compone el servidor.
 * ## Anatomía
 * Cabecera con remitente y asunto, cuerpo en un `iframe` aislado y aviso de actualización.
 * ## Accesibilidad
 * El `iframe` lleva título; el aviso de actualización se anuncia con `role="status"`.
 * ## Responsive
 * Ocupa el ancho de su columna y se pega al borde superior desde `lg` (1024 px).
 */
export function CorreoVistaPrevia({ asunto, vista, cargando }: CorreoVistaPreviaProps) {
  return (
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
      {cargando ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Actualizando la vista previa…
        </p>
      ) : null}
    </aside>
  );
}
